import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OriginaWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { getOnboardingOptions, saveProfile } from "@/lib/origina/actions";
import { CAMPUSES, ROLE_META, type Role } from "@/lib/origina/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

function Onboarding() {
  const user = useCurrentUser();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(user?.displayName ?? "");
  const [role, setRole] = useState<Role>("student");
  const [campus, setCampus] = useState<(typeof CAMPUSES)[number]["id"]>("athlone");
  const [studentNumber, setStudentNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opts = useQuery({
    queryKey: ["onboarding-options"],
    queryFn: () => getOnboardingOptions(),
  });
  const assigned = opts.data && !opts.data.demoMode ? opts.data.assignedRole : null;
  const effectiveRole: Role = assigned ?? role;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-12">
      <OriginaWordmark />
      <h1 className="font-display mt-8 text-3xl font-medium tracking-tight">
        Set your place in the college
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Origina uses this to route reports, Moodle links and training.
        {opts.data?.demoMode
          ? " Demo mode: choose any role so the walkthrough can be shown."
          : " Staff and administrator access is granted by an administrator on the People page."}
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await saveProfile({
              data: { fullName, role: effectiveRole, campus, studentNumber },
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
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        {opts.isPending ? null : assigned ? (
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="block text-sm font-semibold">Role: {ROLE_META[assigned].label}</span>
            <span className="text-xs text-muted">{ROLE_META[assigned].hint}</span>
          </div>
        ) : (
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
                    role === id ? "border-teal bg-teal-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="block text-sm font-semibold">{ROLE_META[id].label}</span>
                  <span className="text-xs text-muted">{ROLE_META[id].hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-soft">Campus</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {CAMPUSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCampus(c.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left",
                  campus === c.id ? "border-teal bg-teal-soft" : "border-line bg-surface",
                )}
              >
                <span className="block text-sm font-semibold">{c.place}</span>
                <span className="text-xs text-muted">
                  {c.region} · {c.name}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        {effectiveRole === "student" && (
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
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Enter Origina"}
        </Button>
      </form>
    </main>
  );
}
