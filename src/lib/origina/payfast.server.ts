/**
 * PayFast (server-only): subscription checkout fields, ITN (payment
 * notification) checks, and the subscriptions API for cancel / change amount.
 *
 * Env vars:
 *   PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE (required for subscriptions)
 *   PAYFAST_SANDBOX=true while testing with sandbox.payfast.co.za
 */
import { createHash } from "node:crypto";
import { promises as dns } from "node:dns";

const env = (k: string) => process.env[k]?.trim() || undefined;

export function payfastConfig() {
  const merchantId = env("PAYFAST_MERCHANT_ID");
  const merchantKey = env("PAYFAST_MERCHANT_KEY");
  const passphrase = env("PAYFAST_PASSPHRASE");
  const sandbox = env("PAYFAST_SANDBOX") === "true";
  return {
    configured: Boolean(merchantId && merchantKey && passphrase),
    merchantId: merchantId ?? "",
    merchantKey: merchantKey ?? "",
    passphrase: passphrase ?? "",
    sandbox,
    processUrl: sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process",
    validateUrl: sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate",
  };
}

/** PHP `urlencode` compatible encoding (what PayFast signs with). */
export function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

/** Signature for the checkout form: non-empty fields in order, then the passphrase. */
export function signForm(fields: [string, string][], passphrase: string): string {
  const parts = fields
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v.trim())}`);
  if (passphrase) parts.push(`passphrase=${pfEncode(passphrase.trim())}`);
  return md5(parts.join("&"));
}

function saDate(d = new Date()): string {
  // YYYY-MM-DD in South African time.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(d);
}

export function buildSubscriptionCheckout(input: {
  baseUrl: string;
  checkoutId: string;
  orgId: string;
  seats: number;
  amountCents: number;
  firstName: string;
  lastName: string;
  email: string;
}) {
  const cfg = payfastConfig();
  if (!cfg.configured) throw new Error("Online payments are not set up yet. Contact Innovo Networks.");
  const amount = (input.amountCents / 100).toFixed(2);
  // Leave out characters that PayFast's signature encoders disagree on.
  const plain = (v: string, max: number) => v.replace(/[~!'()*"<>]/g, "").trim().slice(0, max);
  const fields: [string, string][] = [
    ["merchant_id", cfg.merchantId],
    ["merchant_key", cfg.merchantKey],
    ["return_url", `${input.baseUrl}/app/billing?paid=1`],
    ["cancel_url", `${input.baseUrl}/app/billing?cancelled=1`],
    ["notify_url", `${input.baseUrl}/api/payfast/notify`],
    ["name_first", plain(input.firstName, 100)],
    ["name_last", plain(input.lastName, 100)],
    ["email_address", input.email.trim().slice(0, 100)],
    ["m_payment_id", input.checkoutId],
    ["amount", amount],
    ["item_name", `Origina Pro, ${input.seats} staff ${input.seats === 1 ? "seat" : "seats"}`],
    ["custom_str1", input.orgId],
    ["custom_int1", String(input.seats)],
    ["subscription_type", "1"],
    ["billing_date", saDate()],
    ["recurring_amount", amount],
    ["frequency", "3"], // monthly
    ["cycles", "0"], // until cancelled
  ];
  const signature = signForm(fields, cfg.passphrase);
  return {
    action: cfg.processUrl,
    fields: [...fields.filter(([, v]) => v !== ""), ["signature", signature]] as [string, string][],
  };
}

/* ───────────── ITN (Instant Transaction Notification) ───────────── */

export type ItnResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; reason: string };

const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

async function payfastIps(): Promise<Set<string>> {
  const ips = new Set<string>();
  await Promise.all(
    PAYFAST_HOSTS.map(async (h) => {
      try {
        for (const a of await dns.lookup(h, { all: true })) ips.add(a.address);
      } catch {
        /* host may not resolve; ignore */
      }
    }),
  );
  return ips;
}

function clientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

/** Run every PayFast ITN security check. `rawBody` is the exact posted body. */
export async function verifyItn(request: Request, rawBody: string): Promise<ItnResult> {
  const cfg = payfastConfig();
  if (!cfg.configured) return { ok: false, reason: "PayFast not configured" };

  // Keep PayFast's field order: the signature is computed over it.
  const pairs: [string, string][] = [];
  for (const part of rawBody.split("&")) {
    if (!part) continue;
    const i = part.indexOf("=");
    const k = decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, " "));
    const v = i < 0 ? "" : decodeURIComponent(part.slice(i + 1).replace(/\+/g, " "));
    pairs.push([k, v]);
  }
  const data = Object.fromEntries(pairs);
  const paramString = pairs
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join("&");

  // 1. Signature
  const expected = md5(`${paramString}&passphrase=${pfEncode(cfg.passphrase)}`);
  if (expected !== data.signature) return { ok: false, reason: "bad signature" };

  // 2. Merchant
  if (data.merchant_id !== cfg.merchantId) return { ok: false, reason: "wrong merchant" };

  // 3. Source address (skipped in sandbox)
  if (!cfg.sandbox) {
    const ip = clientIp(request);
    const allowed = await payfastIps();
    if (!ip || !allowed.has(ip)) return { ok: false, reason: `untrusted source ${ip ?? "unknown"}` };
  }

  // 4. Ask PayFast to confirm it sent this
  try {
    const res = await fetch(cfg.validateUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: paramString,
    });
    const text = (await res.text()).trim();
    if (text !== "VALID") return { ok: false, reason: `validate said ${text.slice(0, 40)}` };
  } catch (e) {
    return { ok: false, reason: `validate failed: ${e instanceof Error ? e.message : e}` };
  }

  return { ok: true, data };
}

/* ───────────── Subscriptions API ───────────── */

/** ISO-8601 timestamp in South African time, e.g. 2026-10-08T14:05:00+02:00. */
function saTimestamp(d = new Date()): string {
  const local = new Date(d.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19);
  return `${local}+02:00`;
}

async function subscriptionApi(
  token: string,
  action: "cancel" | "update",
  method: "PUT" | "PATCH",
  body: Record<string, string> = {},
) {
  const cfg = payfastConfig();
  if (!cfg.configured) throw new Error("PayFast is not configured.");
  const headers: Record<string, string> = {
    "merchant-id": cfg.merchantId,
    version: "v1",
    timestamp: saTimestamp(),
  };
  const all: Record<string, string> = { ...headers, ...body, passphrase: cfg.passphrase };
  const signature = md5(
    Object.keys(all)
      .sort()
      .map((k) => `${k}=${pfEncode(String(all[k]).trim())}`)
      .join("&"),
  );
  const url = `https://api.payfast.co.za/subscriptions/${encodeURIComponent(token)}/${action}${
    cfg.sandbox ? "?testing=true" : ""
  }`;
  const res = await fetch(url, {
    method,
    headers: { ...headers, signature, "content-type": "application/json" },
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PayFast ${action} failed (${res.status}): ${text.slice(0, 200)}`);
  return text;
}

export const cancelPayfastSubscription = (token: string) =>
  subscriptionApi(token, "cancel", "PUT");

/** Change the monthly amount from the next billing date. `amountCents` in cents. */
export const updatePayfastAmount = (token: string, amountCents: number) =>
  subscriptionApi(token, "update", "PATCH", { amount: String(amountCents) });
