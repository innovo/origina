import { createAuthClient } from "better-auth/react";

/** Better Auth client (browser-side), talking to same-origin `/api/auth/*`. */
export const authClient = createAuthClient();

/** False only when `VITE_AUTH_ENABLED=false` (local dev user mode). */
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

/** Sign out, then redirect. Rejects if the server doesn't confirm. */
export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "Sign-out failed");
  window.location.href = redirectTo;
}
