import { createFileRoute } from "@tanstack/react-router";
import { runAnalysis } from "@/lib/origina/analysis";
import { authenticateApiRequest, json, reportUrl } from "@/lib/origina/api-auth";

/**
 * POST /api/v1/check
 * Authorization: Bearer <API key from the API page>
 * Body (JSON): { text, title?, filename?, author?, assignmentId? }
 */
export const Route = createFileRoute("/api/v1/check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const client = await authenticateApiRequest(request);
        if (!client) return json({ error: "Invalid or missing API key." }, 401);

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "Send a JSON body." }, 400);
        }
        const text = String(body.text ?? "").trim();
        if (text.length < 40) return json({ error: "text must be at least 40 characters." }, 400);
        if (text.length > 80000) return json({ error: "text is over 80,000 characters." }, 413);
        const filename = String(body.filename ?? "api.txt").trim().slice(0, 200) || "api.txt";
        const title =
          String(body.title ?? "").trim().slice(0, 200) ||
          filename.replace(/\.[^.]+$/, "") ||
          "API submission";

        try {
          const result = await runAnalysis({
            orgId: client.orgId,
            userId: `api:${client.id}`,
            role: "api",
            authorName: String(body.author ?? "").trim().slice(0, 120) || client.name,
            title,
            filename,
            text,
            assignmentId: body.assignmentId ? String(body.assignmentId) : null,
          });
          return json(
            {
              reportId: result.reportId,
              similarity: result.findings.similarity,
              aiIndicator: result.findings.ai.likelihood,
              obfuscationFlags: result.findings.obfuscation.flags.length,
              language: result.findings.language.name,
              reportUrl: reportUrl(request, result.reportId),
            },
            201,
          );
        } catch (err) {
          return json({ error: err instanceof Error ? err.message : "Analysis failed." }, 400);
        }
      },
    },
  },
});
