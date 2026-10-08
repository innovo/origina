import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CreditCard, Lock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  cancelSubscription,
  changeSeats,
  getBilling,
  saveBillingDetails,
  startCheckout,
} from "@/lib/origina/actions";
import { PLAN_LABEL, rand } from "@/lib/origina/billing";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/billing")({
  validateSearch: (s: Record<string, unknown>): { paid?: string; cancelled?: string } => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
    cancelled: typeof s.cancelled === "string" ? s.cancelled : undefined,
  }),
  component: Billing,
});

/** Send the browser to PayFast with a signed form. */
function postToPayfast(action: string, fields: [string, string][]) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function Billing() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const q = useQuery({
    queryKey: ["billing"],
    queryFn: () => getBilling(),
    // Right after PayFast, the payment notice can take a few seconds to arrive.
    refetchInterval: (query) =>
      search.paid && query.state.data?.state.plan !== "pro" ? 3000 : false,
  });
  const b = q.data;

  const [seats, setSeats] = useState(1);
  const [details, setDetails] = useState({ company: "", vat: "", address: "", email: "" });
  useEffect(() => {
    if (!b) return;
    setSeats(Math.max(b.state.plan === "pro" ? b.state.seats : b.staff, 1));
    setDetails(b.details);
  }, [b?.state.seats, b?.staff, b?.details.company]);

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["billing"] }),
      qc.invalidateQueries({ queryKey: ["profile"] }),
    ]);

  const saveDetails = useMutation({
    mutationFn: () => saveBillingDetails({ data: details }),
    onSuccess: refresh,
  });
  const checkout = useMutation({
    mutationFn: async () => {
      await saveBillingDetails({ data: details });
      return startCheckout({ data: { seats } });
    },
    onSuccess: (c) => postToPayfast(c.action, c.fields),
  });
  const updateSeats = useMutation({ mutationFn: () => changeSeats({ data: { seats } }), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: () => cancelSubscription(), onSuccess: refresh });

  if (q.isPending) return <p className="text-muted">Loading…</p>;
  if (q.error || !b) return <p className="text-risk">{q.error?.message ?? "Could not load billing."}</p>;

  const s = b.state;
  const minSeats = Math.max(b.staff, 1);
  const total = b.seatPriceCents * seats;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Billing</h1>
        <p className="mt-1 text-ink-soft">{b.orgName}</p>
      </header>

      {search.paid && s.plan !== "pro" && (
        <aside className="rounded-[22px] border border-lime-deep bg-lime-soft p-5">
          Thanks. We're confirming your payment with PayFast. This page will update in a moment.
        </aside>
      )}
      {search.paid && s.plan === "pro" && (
        <aside className="rounded-[22px] border border-lime-deep bg-lime-soft p-5 font-semibold">
          Payment received. Your Pro subscription is active.
        </aside>
      )}
      {search.cancelled && (
        <aside className="rounded-[22px] border border-line bg-surface p-5">
          Payment was cancelled. Nothing was charged.
        </aside>
      )}

      <section className="rounded-[22px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted">Current plan</p>
            <p className="font-display mt-1 text-3xl font-medium">{PLAN_LABEL[s.plan]}</p>
          </div>
          <StatusBadge locked={s.locked} status={s.status} />
        </div>
        <ul className="mt-4 space-y-1.5 text-ink-soft">
          {s.plan === "trial" && !s.locked && (
            <li>
              {s.trialDaysLeft} {s.trialDaysLeft === 1 ? "day" : "days"} left, ends{" "}
              {s.trialEndsAt && formatDate(s.trialEndsAt)}
            </li>
          )}
          {s.plan === "trial" && s.locked && <li>Your free trial has ended. Subscribe to keep using Origina.</li>}
          {s.plan === "pro" && (
            <>
              <li>
                {s.seats} staff {s.seats === 1 ? "seat" : "seats"} at {rand(s.seatPriceCents)} each,{" "}
                {rand(s.seats * s.seatPriceCents)} per month
              </li>
              {s.paidUntil && (
                <li>
                  {s.status === "cancelled" ? "Access ends" : "Next payment around"} {formatDate(s.paidUntil)}
                </li>
              )}
            </>
          )}
          {s.plan === "institution" && <li>Billed by Innovo Networks. Contact us to make changes.</li>}
          <li>
            {b.staff} staff {b.staff === 1 ? "member" : "members"} (lecturers and administrators). Students are
            free.
          </li>
        </ul>
      </section>

      {!b.canManage ? (
        <p className="text-ink-soft">Only your institution's administrators can manage billing.</p>
      ) : s.plan === "institution" ? null : (
        <>
          <section className="rounded-[22px] border border-line bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="size-5 text-lime-ink" />
              {b.hasSubscription ? "Change seats" : "Subscribe to Pro"}
            </h2>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <Label htmlFor="seats">Staff seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={minSeats}
                  max={1000}
                  value={seats}
                  onChange={(e) => setSeats(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-32"
                />
              </div>
              <p className="pb-2.5 text-ink-soft">
                {seats} x {rand(b.seatPriceCents)} ={" "}
                <span className="font-semibold text-ink">{rand(total)} per month</span>
              </p>
            </div>
            {seats < minSeats && (
              <p className="mt-2 text-sm text-risk">
                You need at least {minSeats} {minSeats === 1 ? "seat" : "seats"} for your current staff.
              </p>
            )}

            {b.hasSubscription ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => updateSeats.mutate()}
                  disabled={updateSeats.isPending || seats < minSeats || seats === s.seats}
                >
                  {updateSeats.isPending ? "Updating…" : "Update seats"}
                </Button>
                <Button
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (window.confirm("Cancel your subscription? Access continues until the end of the paid month."))
                      cancel.mutate();
                  }}
                >
                  {cancel.isPending ? "Cancelling…" : "Cancel subscription"}
                </Button>
                {updateSeats.isSuccess && (
                  <p className="w-full text-sm text-lime-ink">
                    Seats updated. The new amount applies from your next monthly payment.
                  </p>
                )}
                {(updateSeats.error || cancel.error) && (
                  <p className="w-full text-sm text-risk">{(updateSeats.error || cancel.error)?.message}</p>
                )}
              </div>
            ) : (
              <>
                <BillingDetailsForm details={details} setDetails={setDetails} />
                {!b.paymentsEnabled && (
                  <p className="mt-4 text-sm text-risk">
                    Online payments aren't switched on yet. Please contact Innovo Networks.
                  </p>
                )}
                {checkout.error && <p className="mt-4 text-sm text-risk">{checkout.error.message}</p>}
                <Button
                  size="lg"
                  className="mt-5"
                  onClick={() => checkout.mutate()}
                  disabled={!b.paymentsEnabled || checkout.isPending || seats < minSeats}
                >
                  {checkout.isPending ? "Opening PayFast…" : `Pay ${rand(total)} with PayFast`}
                </Button>
                <p className="mt-2 text-sm text-muted">
                  Renews monthly. Cancel any time on this page.
                </p>
              </>
            )}
          </section>

          {b.hasSubscription && (
            <section className="rounded-[22px] border border-line bg-surface p-6">
              <h2 className="text-lg font-semibold">Billing details</h2>
              <BillingDetailsForm details={details} setDetails={setDetails} />
              <Button className="mt-4" variant="outline" onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending}>
                {saveDetails.isPending ? "Saving…" : "Save details"}
              </Button>
              {saveDetails.isSuccess && <p className="mt-2 text-sm text-lime-ink">Saved.</p>}
              {saveDetails.error && <p className="mt-2 text-sm text-risk">{saveDetails.error.message}</p>}
            </section>
          )}
        </>
      )}

      {b.canManage && b.payments.length > 0 && (
        <section className="rounded-[22px] border border-line bg-surface">
          <h2 className="flex items-center gap-2 border-b border-line px-6 py-4 text-lg font-semibold">
            <Receipt className="size-5 text-lime-ink" /> Payments
          </h2>
          <ul className="divide-y divide-line">
            {b.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 px-6 py-3">
                <span>{formatDate(p.createdAt)}</span>
                <span className="text-ink-soft">
                  {p.amountCents !== null ? rand(p.amountCents) : ""}{" "}
                  {p.status === "COMPLETE" ? "Paid" : p.status === "CANCELLED" ? "Cancelled" : p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ locked, status }: { locked: boolean; status: string }) {
  if (locked)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-soft px-3 py-1 text-sm font-semibold text-risk">
        <Lock className="size-4" /> Locked
      </span>
    );
  const label = status === "trialing" ? "Trial" : status === "cancelled" ? "Cancelled" : "Active";
  return (
    <span className="rounded-full bg-lime-soft px-3 py-1 text-sm font-semibold text-lime-ink">{label}</span>
  );
}

type Details = { company: string; vat: string; address: string; email: string };

function BillingDetailsForm({
  details,
  setDetails,
}: {
  details: Details;
  setDetails: (fn: (d: Details) => Details) => void;
}) {
  const set = (k: keyof Details) => (e: { target: { value: string } }) =>
    setDetails((d) => ({ ...d, [k]: e.target.value }));
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="bc">Company or institution name</Label>
        <Input id="bc" value={details.company} onChange={set("company")} />
      </div>
      <div>
        <Label htmlFor="bv">VAT number (optional)</Label>
        <Input id="bv" value={details.vat} onChange={set("vat")} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="ba">Billing address</Label>
        <Textarea id="ba" className="min-h-24" value={details.address} onChange={set("address")} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="be">Billing email</Label>
        <Input id="be" type="email" value={details.email} onChange={set("email")} />
      </div>
    </div>
  );
}
