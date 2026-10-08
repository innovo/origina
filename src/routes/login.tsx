import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { OriginaWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient, authEnabled } from "@/lib/auth/client";

type Mode = "in" | "up" | "forgot";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: "up" | "forgot" } =>
    search.mode === "up" || search.mode === "forgot" ? { mode: search.mode } : {},
  component: Login,
});

function Login() {
  const { mode: startMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(startMode ?? "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; text: string; resend?: boolean } | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setUnverified(false);
  }

  async function resendVerification() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.sendVerificationEmail({ email, callbackURL: "/app" });
      if (res.error) throw new Error(res.error.message || "Could not send the email.");
      setNotice({
        title: "Check your email",
        text: `We've sent a new confirmation link to ${email}.`,
        resend: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the email.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const res = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        if (res.error) throw new Error(res.error.message || "Could not send the reset email.");
        setNotice({
          title: "Check your email",
          text: `If an account exists for ${email}, we've sent a link to reset the password.`,
        });
        return;
      }
      if (mode === "up") {
        if (!agree) throw new Error("Please accept the Terms and Privacy Policy.");
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          callbackURL: "/app",
        });
        if (res.error) throw new Error(res.error.message || "Could not create the account.");
        // With email verification on, there's no session until the link is clicked.
        if (!res.data?.token) {
          setNotice({
            title: "Confirm your email",
            text: `We've sent a link to ${email}. Click it to finish creating your account.`,
            resend: true,
          });
          return;
        }
      } else {
        const res = await authClient.signIn.email({ email, password, callbackURL: "/app" });
        if (res.error) {
          if (res.error.status === 403 || res.error.code === "EMAIL_NOT_VERIFIED") {
            setUnverified(true);
            throw new Error("Please confirm your email first. We've sent you a new link.");
          }
          throw new Error(res.error.message || "Could not sign in.");
        }
      }
      window.location.assign("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "up" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in to Origina";
  const subtitle =
    mode === "up"
      ? "Start a 14-day free trial. No card needed."
      : mode === "forgot"
        ? "We'll email you a link to choose a new password."
        : "Welcome back.";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 shadow-[var(--shadow-page)]">
        <Link to="/">
          <OriginaWordmark />
        </Link>

        {notice ? (
          <div className="mt-8 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime-soft text-lime-ink">
              <MailCheck className="size-7" />
            </span>
            <h1 className="font-display mt-4 text-2xl font-medium tracking-tight">{notice.title}</h1>
            <p className="mt-2 text-ink-soft">{notice.text}</p>
            <p className="mt-2 text-sm text-muted">Can't find it? Check your spam folder.</p>
            {error && <p className="mt-3 text-sm text-risk">{error}</p>}
            <div className="mt-6 flex flex-col gap-2">
              {notice.resend && (
                <Button variant="outline" onClick={resendVerification} disabled={busy}>
                  {busy ? "Sending…" : "Send the link again"}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setNotice(null);
                  switchMode("in");
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-display mt-6 text-3xl font-medium tracking-tight">{title}</h1>
            <p className="mt-2 text-ink-soft">{subtitle}</p>

            {authEnabled ? (
              <div className="mt-6 space-y-3">
                {mode !== "forgot" && (
                  <div className="flex rounded-xl bg-paper-2 p-1 text-sm">
                    <button
                      type="button"
                      className={`h-10 flex-1 rounded-[10px] ${mode === "in" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
                      onClick={() => switchMode("in")}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      className={`h-10 flex-1 rounded-[10px] ${mode === "up" ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
                      onClick={() => switchMode("up")}
                    >
                      Create account
                    </button>
                  </div>
                )}
                <form onSubmit={onSubmit} className="space-y-3">
                  {mode === "up" && (
                    <div>
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">{mode === "up" ? "Work email" : "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {mode !== "forgot" && (
                    <div>
                      <div className="flex items-baseline justify-between">
                        <Label htmlFor="password">Password</Label>
                        {mode === "in" && (
                          <button
                            type="button"
                            onClick={() => switchMode("forgot")}
                            className="text-sm text-lime-ink hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        autoComplete={mode === "up" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                      {mode === "up" && <p className="mt-1 text-sm text-muted">At least 8 characters.</p>}
                    </div>
                  )}
                  {mode === "up" && (
                    <label className="flex items-start gap-3 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-0.5 size-5 shrink-0 accent-[var(--color-lime-deep)]"
                        required
                      />
                      <span>
                        I agree to the{" "}
                        <Link to="/terms" target="_blank" className="text-lime-ink underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" target="_blank" className="text-lime-ink underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                  )}
                  {error && <p className="text-sm text-risk">{error}</p>}
                  {unverified && (
                    <button
                      type="button"
                      onClick={resendVerification}
                      className="text-sm text-lime-ink hover:underline"
                      disabled={busy}
                    >
                      Send the confirmation link again
                    </button>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy
                      ? "Please wait…"
                      : mode === "up"
                        ? "Create account"
                        : mode === "forgot"
                          ? "Send reset link"
                          : "Sign in"}
                  </Button>
                  {mode === "forgot" && (
                    <button
                      type="button"
                      onClick={() => switchMode("in")}
                      className="w-full text-sm text-lime-ink hover:underline"
                    >
                      Back to sign in
                    </button>
                  )}
                </form>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Sign-in is disabled in this environment.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
