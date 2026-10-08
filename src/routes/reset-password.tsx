import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { OriginaWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string; error?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    try {
      const res = await authClient.resetPassword({ newPassword: password, token: token ?? "" });
      if (res.error) throw new Error(res.error.message || "Could not reset the password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  const invalid = !token || Boolean(linkError);

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 shadow-[var(--shadow-page)]">
        <Link to="/">
          <OriginaWordmark />
        </Link>
        <h1 className="font-display mt-6 text-3xl font-medium tracking-tight">Choose a new password</h1>
        {done ? (
          <>
            <p className="mt-3 text-ink-soft">Your password has been changed.</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Sign in</Link>
            </Button>
          </>
        ) : invalid ? (
          <>
            <p className="mt-3 text-ink-soft">This reset link is invalid or has expired.</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login" search={{ mode: "forgot" }}>
                Request a new link
              </Link>
            </Button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <Label htmlFor="pw">New password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-sm text-muted">At least 8 characters.</p>
            </div>
            <div>
              <Label htmlFor="pw2">Confirm new password</Label>
              <Input
                id="pw2"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-risk">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
