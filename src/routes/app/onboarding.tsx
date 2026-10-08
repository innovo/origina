import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check } from "lucide-react";
import { OriginaWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  findOrganizationByCode,
  getOnboardingOptions,
  getOrganizationCampuses,
  saveProfile,
} from "@/lib/origina/actions";
import { ROLE_META, type Campus, type Role } from "@/lib/origina/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

type OrgChoice = { id: string; name: string; shortName: string; campuses: Campus[] };
type Mode = "matched" | "code" | "existing" | "new";

function Onboarding() {
  const user = useCurrentUser();
  const nav = useNavigate();
  const qc = useQueryClient();
  const opts = useQuery({ queryKey: ["onboarding-options"], queryFn: () => getOnboardingOptions() });

  const [fullName, setFullName] = useState(user?.displayName ?? "");
  const [role, setRole] = useState<Role>("student");
  const [studentNumber, setStudentNumber] = useState("");
  const [mode, setMode] = useState<Mode>("code");
  const [joinCode, setJoinCode] = useState("");
  const [org, setOrg] = useState<OrgChoice | null>(null);
  const [campus, setCampus] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgShort, setNewOrgShort] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [billingVat, setBillingVat] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState(user?.primaryEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = opts.data;
  const platformAdmin = Boolean(data?.isPlatformAdmin);

  // Pre-select the organisation registered for this email domain.
  useEffect(() => {
    if (!data) return;
    if (data.matchedOrg) {
      setMode("matched");
      setOrg(data.matchedOrg);
    } else if (data.isPlatformAdmin) {
      setMode(data.organizations.length ? "existing" : "new");
    } else {
      setMode("new");
    }
  }, [data]);

  useEffect(() => setCampus(""), [org?.id]);

  // The signed-in user loads after first render; prefill once it arrives.
  useEffect(() => {
    if (user?.primaryEmail) setBillingEmail((v) => v || user.primaryEmail!);
    if (user?.displayName) setFullName((v) => v || user.displayName!);
  }, [user?.primaryEmail, user?.displayName]);

  async function lookUpCode() {
    setFinding(true);
    setError(null);
    try {
      setOrg(await findOrganizationByCode({ data: { joinCode } }));
    } catch (err) {
      setOrg(null);
      setError(err instanceof Error ? err.message : "Join code not recognised.");
    } finally {
      setFinding(false);
    }
  }

  async function pickExisting(id: string) {
    const meta = data?.organizations.find((o) => o.id === id);
    if (!meta) return setOrg(null);
    const campuses = await getOrganizationCampuses({ data: { orgId: id } });
    setOrg({ ...meta, campuses });
  }

  const selfServe = mode === "new" && !platformAdmin;
  const effectiveRole: Role = data?.demoMode
    ? role
    : platformAdmin || selfServe
      ? "admin"
      : "student";
  const campuses = mode === "new" ? [] : (org?.campuses ?? []);
  const ready =
    fullName.trim().length >= 2 &&
    (mode === "new" ? newOrgName.trim().length >= 3 : Boolean(org)) &&
    (!selfServe ||
      (billingCompany.trim().length >= 2 && billingAddress.trim().length >= 5 && billingEmail.includes("@"))) &&
    (campuses.length === 0 || Boolean(campus));

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-12">
      <OriginaWordmark />
      <h1 className="font-display mt-8 text-3xl font-medium tracking-tight">
        {selfServe ? "Register your institution" : "Join your institution"}
      </h1>
      {selfServe && (
        <p className="mt-2 text-ink-soft">Your 14-day free trial starts now. No card needed.</p>
      )}
      {data?.demoMode && (
        <p className="mt-2 text-sm text-ink-soft">Demo mode: choose any role.</p>
      )}

      <form
        className="mt-8 space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await saveProfile({
              data: {
                fullName,
                role: effectiveRole,
                campus: campus || null,
                studentNumber,
                joinCode: mode === "code" ? joinCode : "",
                orgId: mode === "matched" || mode === "existing" ? (org?.id ?? null) : null,
                newOrgName: mode === "new" ? newOrgName : "",
                newOrgShortName: mode === "new" ? newOrgShort : "",
                billingCompany: selfServe ? billingCompany : "",
                billingVat: selfServe ? billingVat : "",
                billingAddress: selfServe ? billingAddress : "",
                billingEmail: selfServe ? billingEmail : "",
              },
            });
            await qc.invalidateQueries({ queryKey: ["profile"] });
            await nav({ to: "/app" });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <section className="space-y-3">
          <p className="text-sm font-medium text-ink-soft">Institution</p>

          {mode !== "matched" && (
            <div className="flex flex-wrap gap-2 text-sm">
              {(platformAdmin
                ? ([
                    ["existing", "Existing client"],
                    ["new", "Register a new client"],
                    ["code", "Join code"],
                  ] as const)
                : ([
                    ["new", "Register my institution"],
                    ["code", "I have a join code"],
                  ] as const)
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setOrg(null);
                    setError(null);
                  }}
                  className={cn(
                    "h-10 rounded-full px-3",
                    mode === m ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === "matched" && org && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-lime-deep bg-lime-soft px-4 py-3">
              <span>
                <span className="block text-sm font-semibold">{org.name}</span>
                <span className="text-xs text-ink-soft">Matched from your email</span>
              </span>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-lime-ink hover:underline"
                onClick={() => {
                  setMode("code");
                  setOrg(null);
                }}
              >
                Use a join code
              </button>
            </div>
          )}

          {mode === "code" && (
            <div>
              <Label htmlFor="joinCode">Join code</Label>
              <div className="flex gap-2">
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setOrg(null);
                  }}
                  placeholder="e.g. K7M2QX9A"
                  className="font-mono uppercase tracking-widest"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={lookUpCode}
                  disabled={finding || joinCode.trim().length < 4}
                >
                  {finding ? "Checking…" : "Find"}
                </Button>
              </div>
              {org && (
                <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                  <Check className="size-4 text-lime-ink" /> {org.name}
                </p>
              )}
            </div>
          )}

          {mode === "existing" && (
            <div>
              <Label htmlFor="orgPick">Client organisation</Label>
              <select
                id="orgPick"
                className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm"
                value={org?.id ?? ""}
                onChange={(e) => void pickExisting(e.target.value)}
              >
                <option value="">Select</option>
                {(data?.organizations ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-lime-ink" />{" "}
                {platformAdmin ? "New client organisation" : "Your institution"}
              </p>
              <div>
                <Label htmlFor="newOrg">Full name</Label>
                <Input
                  id="newOrg"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Institution name"
                />
              </div>
              <div>
                <Label htmlFor="newOrgShort">Short name (optional)</Label>
                <Input
                  id="newOrgShort"
                  value={newOrgShort}
                  onChange={(e) => setNewOrgShort(e.target.value)}
                  placeholder="Short name"
                />
              </div>
              {selfServe && (
                <>
                  <p className="pt-2 text-sm font-semibold">Billing details</p>
                  <div>
                    <Label htmlFor="bCompany">Company or institution name for invoices</Label>
                    <Input
                      id="bCompany"
                      value={billingCompany}
                      onChange={(e) => setBillingCompany(e.target.value)}
                      autoComplete="organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bVat">VAT number (optional)</Label>
                    <Input id="bVat" value={billingVat} onChange={(e) => setBillingVat(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="bAddress">Billing address</Label>
                    <Textarea
                      id="bAddress"
                      className="min-h-24"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      autoComplete="street-address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bEmail">Billing email</Label>
                    <Input
                      id="bEmail"
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {campuses.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-soft">Campus</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {campuses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCampus(c.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left",
                    campus === c.id ? "border-lime-deep bg-lime-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="block text-sm font-semibold">{c.name}</span>
                  {c.detail && <span className="text-xs text-muted">{c.detail}</span>}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        {opts.isPending ? null : data?.demoMode ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-soft">Role</legend>
            <div className="grid gap-2">
              {(Object.keys(ROLE_META) as Role[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left",
                    role === id ? "border-lime-deep bg-lime-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="block text-sm font-semibold">{ROLE_META[id].label}</span>
                  <span className="text-xs text-muted">{ROLE_META[id].hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : platformAdmin ? (
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="block text-sm font-semibold">Platform administrator</span>
          </div>
        ) : null}

        {effectiveRole === "student" && mode !== "new" && (
          <div>
            <Label htmlFor="sn">Student number (optional)</Label>
            <Input
              id="sn"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
            />
          </div>
        )}
        {error && <p className="text-sm text-risk">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !ready}>
          {busy ? "Saving…" : selfServe ? "Start free trial" : "Enter Origina"}
        </Button>
      </form>
    </main>
  );
}
