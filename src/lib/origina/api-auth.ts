import { getSql } from "@/lib/db";
import { hashApiKey } from "./api-keys";

export type ApiClient = { id: string; orgId: string; name: string };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Resolve `Authorization: Bearer <key>` to an active API client, or null. */
export async function authenticateApiRequest(request: Request): Promise<ApiClient | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  const hash = await hashApiKey(match[1]);
  const sql = await getSql();
  const rows = await sql<{ id: string; org_id: string; name: string }>`
    select id, org_id, name from api_clients
    where key_hash = ${hash} and revoked_at is null and org_id is not null`;
  const r = rows[0];
  return r ? { id: r.id, orgId: r.org_id, name: r.name } : null;
}

export function reportUrl(request: Request, reportId: string): string {
  return `${new URL(request.url).origin}/app/reports/${reportId}`;
}
