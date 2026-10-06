import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { authenticateApiRequest, json, reportUrl } from "@/lib/origina/api-auth";
import type { Findings } from "@/lib/origina/types";

/** GET /api/v1/reports/:reportId with the same Bearer key. */
export const Route = createFileRoute("/api/v1/reports/$reportId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const client = await authenticateApiRequest(request);
        if (!client) return json({ error: "Invalid or missing API key." }, 401);
        const sql = await getSql();
        const rows = await sql<{
          id: string;
          title: string;
          created_at: string;
          findings_json: string;
        }>`select r.id, s.title, r.created_at, r.findings_json
          from reports r join submissions s on s.id = r.submission_id
          where r.id = ${params.reportId} and s.org_id = ${client.orgId}`;
        const row = rows[0];
        if (!row) return json({ error: "Report not found." }, 404);
        const f = JSON.parse(row.findings_json) as Findings;
        return json({
          reportId: row.id,
          title: row.title,
          createdAt: row.created_at,
          similarity: f.similarity,
          aiIndicator: f.ai.likelihood,
          obfuscationFlags: f.obfuscation.flags.length,
          language: f.language.name,
          sources: f.sources.map((s) => ({ title: s.title, overlapPct: s.overlapPct })),
          reportUrl: reportUrl(request, row.id),
        });
      },
    },
  },
});
