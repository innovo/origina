import { getSql } from "@/lib/db";
import { hashApiKey } from "./api-keys";
import { billingState } from "./billing";

export type ApiClient = { id: string; orgId: string; name: string };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Resolve `Authorization: Bearer <key>` to an active API client, or null. */
export async function authenticateApiRequest(request: Request): Promise<ApiClient | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  const hash = await hashApiKey(match[1]);
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    org_id: string;
    name: string;
    plan: string | null;
    billing_status: string | null;
    trial_ends_at: string | null;
    paid_until: string | null;
    seats: number | null;
    seat_price_cents: number | null;
  }>`
    select a.id, a.org_id, a.name, o.plan, o.billing_status, o.trial_ends_at, o.paid_until, o.seats, o.seat_price_cents
    from api_clients a join organizations o on o.id = a.org_id
    where a.key_hash = ${hash} and a.revoked_at is null`;
  const r = rows[0];
  // Keys stop working while the institution's subscription is inactive.
  if (!r || billingState(r).locked) return null;
  return { id: r.id, orgId: r.org_id, name: r.name };
}

export function reportUrl(request: Request, reportId: string): string {
  return `${new URL(request.url).origin}/app/reports/${reportId}`;
}
