import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { writeAudit } from "@/lib/origina/analysis";
import { rand } from "@/lib/origina/billing";

/**
 * POST /api/payfast/notify
 * PayFast's ITN (payment notification) for Origina Pro subscriptions. Called for
 * the first payment, every monthly renewal, and when a subscription is cancelled.
 */
export const Route = createFileRoute("/api/payfast/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyItn } = await import("@/lib/origina/payfast.server");
        const check = await verifyItn(request, raw);
        if (!check.ok) {
          console.warn(`[payfast] ITN rejected: ${check.reason}`);
          return new Response("Rejected", { status: 400 });
        }
        const d = check.data;
        const sql = await getSql();
        const status = (d.payment_status ?? "").toUpperCase();
        const cents = Math.round(Number(d.amount_gross ?? "0") * 100);
        const token = d.token || null;

        // Which organisation is this for?
        const checkout = d.m_payment_id
          ? (
              await sql<{ id: string; org_id: string; seats: number; amount_cents: number; status: string }>`
                select id, org_id, seats, amount_cents, status from billing_checkouts where id = ${d.m_payment_id}`
            )[0]
          : undefined;
        let orgId = checkout?.org_id ?? null;
        if (!orgId && token) {
          orgId =
            (await sql<{ id: string }>`select id from organizations where payfast_token = ${token}`)[0]?.id ?? null;
        }

        // Record every notification once (PayFast may retry).
        const inserted = await sql<{ id: string }>`
          insert into billing_payments (id, org_id, pf_payment_id, m_payment_id, payment_status, amount_gross_cents, token, raw)
          values (${crypto.randomUUID()}, ${orgId}, ${d.pf_payment_id || null}, ${d.m_payment_id || null},
            ${status || "UNKNOWN"}, ${Number.isFinite(cents) ? cents : null}, ${token}, ${raw})
          on conflict (pf_payment_id) do nothing
          returning id`;
        if (!inserted.length) return new Response("OK");
        if (!orgId) {
          console.warn(`[payfast] ITN for unknown organisation (m_payment_id ${d.m_payment_id})`);
          return new Response("OK");
        }

        if (status === "COMPLETE") {
          const org = (
            await sql<{ name: string; seats: number; seat_price_cents: number; billing_email: string | null }>`
              select name, seats, seat_price_cents, billing_email from organizations where id = ${orgId}`
          )[0];
          const expected = new Set<number>();
          if (checkout) expected.add(checkout.amount_cents);
          if (org) expected.add(org.seats * org.seat_price_cents);
          if (!expected.has(cents)) {
            console.warn(`[payfast] amount ${cents} doesn't match expected for org ${orgId}`);
            return new Response("OK");
          }
          const firstPayment = checkout && checkout.status === "pending";
          await sql`update organizations set plan = 'pro', billing_status = 'active',
              payfast_token = coalesce(${token}, payfast_token),
              seats = ${firstPayment ? checkout!.seats : (org?.seats ?? 0)},
              paid_until = now() + interval '1 month',
              trial_ends_at = null
            where id = ${orgId}`;
          if (firstPayment) await sql`update billing_checkouts set status = 'paid' where id = ${checkout!.id}`;
          await writeAudit("payfast", orgId, "billing.payment", "billing", d.pf_payment_id || undefined, rand(cents));

          const to = org?.billing_email;
          if (to) {
            const { sendEmail, paymentReceivedEmail } = await import("@/lib/email.server");
            const until = new Date(Date.now() + 31 * 86400000).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            await sendEmail(to, "Origina payment received", paymentReceivedEmail(org!.name, rand(cents), until)).catch(
              (e) => console.warn("[payfast] receipt email failed", e),
            );
          }
        } else if (status === "CANCELLED") {
          await sql`update organizations set billing_status = 'cancelled' where id = ${orgId}`;
        }
        return new Response("OK");
      },
    },
  },
});
