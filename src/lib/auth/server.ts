/**
 * Better Auth for Origina (server-only). Email + password sign-in, sessions
 * stored in Postgres (`DATABASE_URL`), or the embedded PGLite database during
 * local `npm run dev` when no `DATABASE_URL` is set.
 *
 * Production env vars:
 *   DATABASE_URL        Postgres connection string (Neon, Supabase, etc.)
 *   BETTER_AUTH_SECRET  32+ random characters (`openssl rand -hex 32`)
 *   BETTER_AUTH_URL     Public URL, e.g. https://origina.innovonet.co.za
 *                       (optional on Vercel: falls back to the Vercel URLs)
 *
 * NEVER import this from client code.
 */
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = env("DATABASE_URL");

/** Auth is always on; `VITE_AUTH_ENABLED=false` switches to a local dev user. */
export const authConfigured = env("VITE_AUTH_ENABLED") !== "false";

// ── Secret ───────────────────────────────────────────────────────────────────
// Local dev: a process-stable random secret (sessions reset on restart).
// Production: must be provided, or every cold start would sign users out.
const globalAuthRef = globalThis as typeof globalThis & { __originaDevSecret__?: string };
function secret(): string {
  const configured = env("BETTER_AUTH_SECRET");
  if (configured) return configured;
  if (isProduction && databaseUrl) {
    throw new Error("BETTER_AUTH_SECRET is not set. Add it to the hosting environment variables.");
  }
  globalAuthRef.__originaDevSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__originaDevSecret__;
}

// ── Public URL / trusted origins ─────────────────────────────────────────────
const withHttps = (host?: string) => (host ? `https://${host}` : undefined);
const explicitBaseURL =
  env("BETTER_AUTH_URL") ?? withHttps(env("VERCEL_PROJECT_PRODUCTION_URL")) ?? undefined;

const LOCAL_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const trustedOrigins = [
  explicitBaseURL,
  withHttps(env("VERCEL_URL")),
  withHttps(env("VERCEL_BRANCH_URL")),
  ...(env("TRUSTED_ORIGINS")
    ?.split(",")
    .map((s) => s.trim()) ?? []),
  ...LOCAL_ORIGINS,
].filter((v): v is string => Boolean(v));

// Derive the base URL from the request host when no fixed URL is configured,
// restricted to hosts we trust.
const baseURL = explicitBaseURL ?? {
  allowedHosts: [
    ...trustedOrigins.map((o) => new URL(o).host),
    "*.vercel.app",
    "localhost:*",
    "127.0.0.1:*",
  ],
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
};

const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl, max: 5 })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "origina.session_token";

export const auth = betterAuth({
  appName: "Origina",
  baseURL,
  secret: secret(),
  database,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Only allow sign-up from these email domains when set, e.g.
    // "westerncape.gov.za,innovonet.co.za". Empty = anyone can sign up.
  },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  advanced: {
    cookiePrefix: "origina",
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowed = env("ALLOWED_SIGNUP_DOMAINS")
            ?.split(",")
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean);
          if (allowed && allowed.length > 0) {
            const domain = user.email.split("@")[1]?.toLowerCase() ?? "";
            if (!allowed.includes(domain)) return false;
          }
          return { data: user };
        },
      },
    },
  },
  // Must be last: bridges Better Auth's Set-Cookie into TanStack Start responses.
  plugins: [tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
