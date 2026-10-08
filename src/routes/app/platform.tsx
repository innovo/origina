import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ArrowRight, Building2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  createOrganization,
  getProfile,
  listDemoRequests,
  listOrganizations,
  setOrgBilling,
  switchOrganization,
} from "@/lib/origina/actions";
import { formatDate } from "@/lib/utils";
import { PLAN_LABEL } from "@/lib/origina/billing";
import type { OrganizationSummary } from "@/lib/origina/types";

export const Route = createFileRoute("/app/platform")({ component: Platform });

function Platform() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: () => listOrganizations() });
  const demos = useQuery({ queryKey: ["demo-requests"], queryFn: () => listDemoRequests() });

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [domains, setDomains] = useState("");
  const [admins, setAdmins] = useState("");
  const [campuses, setCampuses] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createOrganization({
        data: {
          name,
          shortName,
          emailDomains: domains,
          adminEmails: admins,
          campuses: campuses.split("\n"),
        },
      }),
    onSuccess: async () => {
      setName("");
      setShortName("");
      setDomains("");
      setAdmins("");
      setCampuses("");
      await qc.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const open = useMutation({
    mutationFn: (orgId: string) => switchOrganization({ data: { orgId } }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      await nav({ to: "/app" });
    },
  });

  if (profile.data && !profile.data.isPlatformAdmin) {
    return <p className="text-sm text-risk">Platform administrators only.</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Platform</h1>
      </header>

      {create.data && (
        <aside className="rounded-[22px] border border-lime-deep bg-lime-soft p-5 text-sm">
          <p className="font-semibold">{create.data.name} is registered.</p>
          <p className="mt-1 text-ink-soft">
            Join code:{" "}
            <span className="font-mono font-semibold tracking-widest text-ink">
              {create.data.joinCode}
            </span>
          </p>
        </aside>
      )}

      <section className="overflow-x-auto rounded-[22px] border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Join code</th>
              <th className="px-4 py-3 font-medium">People</th>
              <th className="px-4 py-3 font-medium">Submissions</th>
              <th className="px-4 py-3 font-medium">Campuses</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.data?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-muted">
                  No clients yet. Register the first one below.
                </td>
              </tr>
            )}
            {(orgs.data ?? []).map((o) => {
              const current = profile.data?.orgId === o.id;
              return (
                <Fragment key={o.id}>
                <tr className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium">{o.name}</span>
                    {o.emailDomains && (
                      <span className="text-xs text-muted">{o.emailDomains}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(editing === o.id ? null : o.id)}
                      className="text-left hover:underline"
                    >
                      <span className="block font-medium">{PLAN_LABEL[o.billing.plan]}</span>
                      <span className={o.billing.locked ? "text-risk" : "text-muted"}>
                        {o.billing.locked
                          ? "Locked"
                          : o.billing.plan === "trial"
                            ? `${o.billing.trialDaysLeft} days left`
                            : o.billing.status}
                        {o.billing.seats > 0 && ` · ${o.staff}/${o.billing.seats} seats`}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono tracking-widest">{o.joinCode}</td>
                  <td className="px-4 py-3 tabular-nums">{o.people}</td>
                  <td className="px-4 py-3 tabular-nums">{o.submissions}</td>
                  <td className="px-4 py-3 tabular-nums">{o.campuses}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {current ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-lime-ink">
                        Current
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={open.isPending}
                        onClick={() => open.mutate(o.id)}
                      >
                        Open <ArrowRight className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
                {editing === o.id && (
                  <tr className="border-b border-line bg-paper">
                    <td colSpan={8} className="px-4 py-4">
                      <BillingEditor org={o} onDone={() => setEditing(null)} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </section>
      {open.error && <p className="text-sm text-risk">{open.error.message}</p>}

      <section className="rounded-[22px] border border-line bg-surface">
        <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 font-semibold">
          <Inbox className="size-4 text-lime-ink" /> Demo requests
          <span className="text-sm font-normal text-muted">({demos.data?.length ?? 0})</span>
        </h2>
        {demos.data?.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted">No demo requests yet.</p>
        )}
        <ul className="divide-y divide-line">
          {(demos.data ?? []).map((d) => (
            <li key={d.id} className="px-5 py-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {d.name} <span className="font-normal text-ink-soft">at {d.institution}</span>
                </p>
                <span className="text-muted">{formatDate(d.createdAt)}</span>
              </div>
              <p className="mt-1 text-ink-soft">
                <a href={`mailto:${d.email}`} className="text-lime-ink hover:underline">
                  {d.email}
                </a>
                {d.phone && <> · {d.phone}</>}
                {d.role && <> · {d.role}</>}
              </p>
              {d.message && <p className="mt-2 whitespace-pre-wrap text-ink">{d.message}</p>}
            </li>
          ))}
        </ul>
      </section>

      <form
        className="max-w-2xl rounded-[22px] border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <h2 className="flex items-center gap-2 font-semibold">
          <Building2 className="size-4 text-lime-ink" /> Register a client
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pname">Institution name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pshort">Short name</Label>
            <Input
              id="pshort"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Shown in the app header"
            />
          </div>
          <div>
            <Label htmlFor="pdomains">Email domains (optional)</Label>
            <Input
              id="pdomains"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="college.ac.za"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="padmins">Administrator emails</Label>
            <Input
              id="padmins"
              value={admins}
              onChange={(e) => setAdmins(e.target.value)}
              placeholder="it@college.ac.za, registrar@college.ac.za"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pcampuses">Campuses (optional, one per line)</Label>
            <Textarea
              id="pcampuses"
              className="min-h-24"
              value={campuses}
              onChange={(e) => setCampuses(e.target.value)}
            />
          </div>
        </div>
        {create.error && <p className="mt-3 text-sm text-risk">{create.error.message}</p>}
        <Button type="submit" className="mt-4" disabled={create.isPending}>
          {create.isPending ? "Registering…" : "Register client"}
        </Button>
      </form>
    </div>
  );
}

/** Innovo staff set Institution accounts (invoice / EFT) and fix billing by hand. */
function BillingEditor({ org, onDone }: { org: OrganizationSummary; onDone: () => void }) {
  const qc = useQueryClient();
  const b = org.billing;
  const [plan, setPlan] = useState<string>(b.plan);
  const [status, setStatus] = useState<string>(b.status);
  const [until, setUntil] = useState(
    (b.plan === "trial" ? b.trialEndsAt : b.paidUntil)?.slice(0, 10) ?? "",
  );
  const [seats, setSeats] = useState(String(b.seats));
  const save = useMutation({
    mutationFn: () =>
      setOrgBilling({
        data: { orgId: org.id, plan, status, paidUntil: until || null, seats: Number(seats) || 0 },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["organizations"] });
      onDone();
    },
  });
  const sel = "h-11 rounded-xl border border-line bg-surface-2 px-3 text-sm";
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor={`plan-${org.id}`}>Plan</Label>
        <select id={`plan-${org.id}`} className={sel} value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="trial">Free trial</option>
          <option value="pro">Pro (PayFast)</option>
          <option value="institution">Institution (invoice)</option>
        </select>
      </div>
      <div>
        <Label htmlFor={`status-${org.id}`}>Status</Label>
        <select id={`status-${org.id}`} className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="trialing">Trialing</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div>
        <Label htmlFor={`until-${org.id}`}>{plan === "trial" ? "Trial ends" : "Paid until (blank = no end)"}</Label>
        <Input id={`until-${org.id}`} type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`seats-${org.id}`}>Seats (0 = unlimited)</Label>
        <Input
          id={`seats-${org.id}`}
          type="number"
          min={0}
          className="w-28"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
        />
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save"}
      </Button>
      <Button variant="ghost" onClick={onDone}>
        Close
      </Button>
      {save.error && <p className="w-full text-sm text-risk">{save.error.message}</p>}
    </div>
  );
}
