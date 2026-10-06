import { getSql } from "@/lib/db";
import { analyseLocal } from "./engine";
import type { CorpusDoc } from "./corpus";
import type { Findings, Role, SourceType } from "./types";

/** Server-side analysis shared by the app (server functions) and the REST API. */

export async function writeAudit(
  actorUserId: string,
  orgId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  detail?: string,
) {
  const sql = await getSql();
  await sql`insert into audit_log (id, org_id, actor_user_id, action, entity_type, entity_id, detail)
    values (${crypto.randomUUID()}, ${orgId}, ${actorUserId}, ${action}, ${entityType ?? null}, ${entityId ?? null}, ${detail ?? null})`;
}

type AiPayload = {
  likelihood: number;
  confidence: "low" | "medium" | "high";
  summary: string;
  indicators: string[];
  passages: { quote: string; reason: string }[];
  translationSuspicion: boolean;
  paraphraseSuspicion: boolean;
  citationIssues: { citation: string; issue: string }[];
};

const AUTHORSHIP_SYSTEM =
  "You are Origina's authorship agent for an educational institution. You provide decision-support indicators only, never a finding of misconduct. Reply with a single JSON object only, no prose and no code fences.";

function authorshipPrompt(clipped: string): string {
  return `Screen this student submission for signs of AI-generated or AI-assisted writing, translation/rework to hide a source, and fabricated or impossible citations. Return JSON with keys: likelihood (0-100 integer), confidence ("low"|"medium"|"high"), summary (2 sentences, cautious), indicators (string array, max 6), passages (array of {quote, reason}, max 4 short quotes), translationSuspicion (boolean), paraphraseSuspicion (boolean), citationIssues (array of {citation, issue}, max 5).
Submission:
${clipped}`;
}

/** Call Claude (ANTHROPIC_API_KEY) or xAI (XAI_API_KEY); returns raw model text. */
async function callAuthorshipModel(prompt: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL?.trim() || "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        temperature: 0.2,
        system: AUTHORSHIP_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error(
        "[authorship] Anthropic API error",
        res.status,
        await res.text().catch(() => ""),
      );
      return null;
    }
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    return body.content?.find((c) => c.type === "text")?.text ?? null;
  }

  const xaiKey = process.env.XAI_API_KEY?.trim();
  if (xaiKey) {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL?.trim() || "grok-4.5",
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AUTHORSHIP_SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[authorship] xAI API error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return body.choices?.[0]?.message?.content ?? null;
  }
  return null;
}

async function runAuthorshipAgent(text: string): Promise<AiPayload | null> {
  const clipped = text.length > 5500 ? text.slice(0, 5500) + "\n[truncated]" : text;
  let content: string | null;
  try {
    content = await callAuthorshipModel(authorshipPrompt(clipped));
  } catch (err) {
    console.error("[authorship] request failed", err);
    return null;
  }
  if (!content) return null;
  // Tolerate code fences or stray prose around the JSON object.
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as AiPayload;
    if (typeof parsed.likelihood !== "number") return null;
    parsed.likelihood = Math.max(0, Math.min(100, Math.round(parsed.likelihood)));
    parsed.indicators ??= [];
    parsed.passages ??= [];
    parsed.citationIssues ??= [];
    return parsed;
  } catch {
    return null;
  }
}

export type AnalysisInput = {
  orgId: string;
  /** Profile user id, or `api:<clientId>` for REST API submissions. */
  userId: string;
  role: Role | "api";
  authorName: string | null;
  title: string;
  filename: string;
  text: string;
  assignmentId: string | null;
};

export async function runAnalysis(input: AnalysisInput): Promise<{
  submissionId: string;
  reportId: string;
  findings: Findings;
}> {
  const sql = await getSql();

  if (input.assignmentId) {
    const ok = await sql<{ id: string }>`
      select a.id from assignments a join courses c on c.id = a.course_id
      where a.id = ${input.assignmentId} and c.org_id = ${input.orgId}`;
    if (!ok[0]) throw new Error("Assignment not found.");
  }

  const previousRows = await sql<{ id: string; title: string; extracted_text: string }>`
    select id, title, extracted_text from submissions
    where user_id = ${input.userId} and org_id = ${input.orgId}
    order by created_at desc
    limit 8`;

  // Other people's work in the same institution (peer plagiarism) and the
  // institution's own source library. Never another institution's data.
  const peerRows = await sql<{ id: string; extracted_text: string; created_at: string }>`
    select id, extracted_text, created_at from submissions
    where org_id = ${input.orgId} and user_id <> ${input.userId}
    order by created_at desc
    limit 300`;
  const libraryRows = await sql<{
    id: string;
    title: string;
    source_type: string;
    source_ref: string | null;
    body: string;
  }>`select id, title, source_type, source_ref, body from corpus where org_id = ${input.orgId}`;
  const extraCorpus: CorpusDoc[] = [
    ...libraryRows.map((r) => ({
      id: `lib-${r.id}`,
      title: r.title,
      sourceType: (r.source_type as SourceType) || "institutional",
      sourceRef: r.source_ref ?? "Institution library",
      body: r.body,
    })),
    ...peerRows.map((r) => ({
      id: `peer-${r.id}`,
      title: `Earlier submission (${new Date(r.created_at).toISOString().slice(0, 10)})`,
      sourceType: "previous" as const,
      sourceRef: "Another student at this institution",
      body: r.extracted_text.slice(0, 20000),
    })),
  ];

  const findings = analyseLocal({
    text: input.text,
    previous: previousRows.map((r) => ({ id: r.id, title: r.title, body: r.extracted_text })),
    extraCorpus,
  });

  const ai = await runAuthorshipAgent(findings.obfuscation.cleanedText);
  if (ai) {
    findings.ai = {
      likelihood: ai.likelihood,
      confidence: ai.confidence,
      summary: ai.summary,
      indicators: Array.isArray(ai.indicators) ? ai.indicators.slice(0, 6) : [],
      passages: Array.isArray(ai.passages) ? ai.passages.slice(0, 4) : [],
      translationSuspicion: Boolean(ai.translationSuspicion),
      paraphraseSuspicion: Boolean(ai.paraphraseSuspicion) || findings.ai.paraphraseSuspicion,
      unavailable: false,
    };
    if (Array.isArray(ai.citationIssues)) {
      for (const issue of ai.citationIssues) {
        if (!issue?.citation) continue;
        const existing = findings.citations.find((c) =>
          c.text.includes(issue.citation.slice(0, 24)),
        );
        if (existing) {
          existing.ok = false;
          existing.issue = issue.issue;
        } else {
          findings.citations.push({ text: issue.citation, ok: false, issue: issue.issue });
        }
      }
    }
  }

  const submissionId = crypto.randomUUID();
  const reportId = crypto.randomUUID();
  await sql`insert into submissions (id, org_id, user_id, assignment_id, title, filename, extracted_text, language, status, author_name)
    values (${submissionId}, ${input.orgId}, ${input.userId}, ${input.assignmentId}, ${input.title}, ${input.filename}, ${input.text}, ${findings.language.name}, ${"ready"}, ${input.authorName})`;
  await sql`insert into reports (id, submission_id, similarity_pct, ai_pct, findings_json)
    values (${reportId}, ${submissionId}, ${findings.similarity}, ${findings.ai.likelihood}, ${JSON.stringify(findings)})`;
  await writeAudit(
    input.userId,
    input.orgId,
    "submission.analyse",
    "report",
    reportId,
    `${input.role} · similarity ${findings.similarity}%`,
  );
  return { submissionId, reportId, findings };
}
