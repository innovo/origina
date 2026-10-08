/** Plans, prices and access rules shared by the server and the UI. */

export type Plan = "trial" | "pro" | "institution";
export type BillingStatus = "trialing" | "active" | "cancelled" | "expired";

export const TRIAL_DAYS = 14;
/** Days of access after a missed Pro renewal before the workspace locks. */
export const GRACE_DAYS = 3;
export const DEFAULT_SEAT_PRICE_CENTS = 8900;

export type BillingState = {
  plan: Plan;
  status: BillingStatus;
  trialEndsAt: string | null;
  paidUntil: string | null;
  seats: number;
  seatPriceCents: number;
  /** True when the workspace can't be used until someone pays. */
  locked: boolean;
  /** Whole days left in the trial (0 when not trialling). */
  trialDaysLeft: number;
};

const DAY = 24 * 60 * 60 * 1000;

export function billingState(row: {
  plan: string | null;
  billing_status: string | null;
  trial_ends_at: string | Date | null;
  paid_until: string | Date | null;
  seats: number | null;
  seat_price_cents: number | null;
}, now = Date.now()): BillingState {
  const plan = (row.plan ?? "trial") as Plan;
  const status = (row.billing_status ?? "trialing") as BillingStatus;
  const trialEnds = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : null;
  const paidUntil = row.paid_until ? new Date(row.paid_until).getTime() : null;

  let locked: boolean;
  if (plan === "institution") {
    locked = status === "expired" || (paidUntil !== null && paidUntil < now);
  } else if (plan === "pro") {
    locked = paidUntil === null || paidUntil + GRACE_DAYS * DAY < now;
  } else {
    locked = trialEnds === null || trialEnds < now;
  }

  return {
    plan,
    status: plan === "trial" && locked ? "expired" : status,
    trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at).toISOString() : null,
    paidUntil: row.paid_until ? new Date(row.paid_until).toISOString() : null,
    seats: row.seats ?? 0,
    seatPriceCents: row.seat_price_cents ?? DEFAULT_SEAT_PRICE_CENTS,
    locked,
    trialDaysLeft:
      plan === "trial" && trialEnds && trialEnds > now ? Math.ceil((trialEnds - now) / DAY) : 0,
  };
}

export function rand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export const PLAN_LABEL: Record<Plan, string> = {
  trial: "Free trial",
  pro: "Pro",
  institution: "Institution",
};
