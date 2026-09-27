import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { OriginaWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient, authEnabled } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message || "Could not create the account.");
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message || "Could not sign in.");
      }
      window.location.assign("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 shadow-[var(--shadow-page)]">
        <Link to="/">
          <OriginaWordmark />
        </Link>
        <h1 className="font-display mt-6 text-3xl font-medium tracking-tight">
          Sign in to Origina
        </h1>
        <p className="mt-2 text-sm text-muted">
          Staff and students of WCCN and CEC. Sign in with your email address.
        </p>

        {authEnabled ? (
          <div className="mt-6 space-y-3">
            <div className="flex rounded-xl bg-paper-2 p-1 text-sm">
              <button
                type="button"
                className={`h-9 flex-1 rounded-[10px] ${mode === "in" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
                onClick={() => setMode("in")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`h-9 flex-1 rounded-[10px] ${mode === "up" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
                onClick={() => setMode("up")}
              >
                Create account
              </button>
            </div>
            <form onSubmit={onEmail} className="space-y-3">
              {mode === "up" && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              {error && <p className="text-sm text-risk">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in with email"}
              </Button>
            </form>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled in this environment.</p>
        )}
      </div>
    </main>
  );
}
