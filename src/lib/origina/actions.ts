import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CORPUS, INSTITUTION_ASSIGNMENTS, INSTITUTION_COURSES } from "./corpus";
import { analyseLocal } from "./engine";
import type {
  AssignmentRow,
  AuditRow,
  CampusId,
  CourseRow,
  DashboardData,
  Findings,
  Profile,
  Role,
  SubmissionRow,
} from "./types";

const STAFF: Role[] = ["teacher", "admin"];

function isCampus(v: string): v is CampusId {
  return ["athlone", "worcester", "stikland", "tygerberg"].includes(v);
}
function isRole(v: string): v is Role {
  return v === "student" || v === "teacher" || v === "admin";
}

async function writeAudit(
  actorUserId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  detail?: string,
) {
  const sql = await getSql();
  await sql`insert into audit_log (id, actor_user_id, action, entity_type, entity_id, detail)
    values (${crypto.randomUUID()}, ${actorUserId}, ${action}, ${entityType ?? null}, ${entityId ?? null}, ${detail ?? null})`;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    full_name: string;
    role: Role;
    campus: CampusId;
    student_number: string | null;
    created_at: string;
  }>`select user_id, full_name, role, campus, student_number, created_at from profiles where user_id = ${userId}`;
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    fullName: r.full_name,
    role: r.role,
    campus: r.campus,
    studentNumber: r.student_number,
    createdAt: r.created_at,
  };
}

async function requireProfile(userId: string): Promise<Profile> {
  const p = await loadProfile(userId);
  if (!p) throw new Error("Complete onboarding before using Origina.");
  return p;
}

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  const sql = await getSql();
  const [{ n }] = await sql<{ n: number }>`select count(*)::int as n from corpus`;
  if (n === 0) {
    for (const c of CORPUS) {
      await sql`insert into corpus (id, title, source_type, source_ref, body)
        values (${c.id}, ${c.title}, ${c.sourceType}, ${c.sourceRef}, ${c.body})
        on conflict (id) do nothing`;
    }
  }
  const [{ cn }] = await sql<{ cn: number }>`select count(*)::int as cn from courses`;
  if (cn === 0) {
    for (const c of INSTITUTION_COURSES) {
      await sql`insert into courses (id, code, title, campus, owner_user_id)
        values (${c.id}, ${c.code}, ${c.title}, ${c.campus}, ${"institution"})
        on conflict (id) do nothing`;
    }
    for (const a of INSTITUTION_ASSIGNMENTS) {
      await sql`insert into assignments (id, course_id, title, description)
        values (${a.id}, ${a.courseId}, ${a.title}, ${a.description})
        on conflict (id) do nothing`;
    }
  }
  seeded = true;
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
  "You are Origina's authorship agent for a South African nursing and emergency-care college. You provide decision-support indicators only — never a finding of misconduct. Reply with a single JSON object only, no prose and no code fences.";

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

function mapSubmission(r: {
  id: string;
  user_id: string;
  assignment_id: string | null;
  title: string;
  filename: string;
  language: string | null;
  status: string;
  created_at: string;
  similarity_pct: number | null;
  ai_pct: number | null;
  report_id: string | null;
  author_name: string | null;
}): SubmissionRow {
  return {
    id: r.id,
    userId: r.user_id,
    assignmentId: r.assignment_id,
    title: r.title,
    filename: r.filename,
    language: r.language,
    status: r.status,
    createdAt: r.created_at,
    similarityPct: r.similarity_pct,
    aiPct: r.ai_pct,
    reportId: r.report_id,
    authorName: r.author_name,
  };
}

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded();
    return loadProfile(context.userId);
  });

/** DEMO_MODE=true lets new users pick any role (for walkthroughs). */
function demoMode(): boolean {
  return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
}

async function userEmail(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  return rows[0]?.email?.toLowerCase() ?? null;
}

/**
 * The role a NEW profile actually gets. Outside demo mode: the first person to
 * onboard, or anyone listed in ADMIN_EMAILS, becomes admin; everyone else is a
 * student until an administrator promotes them on the People page.
 */
async function grantableRole(userId: string, requested: Role): Promise<Role> {
  if (demoMode()) return requested;
  const sql = await getSql();
  const [{ n }] = await sql<{
    n: number;
  }>`select count(*)::int as n from profiles where user_id <> ${userId}`;
  if (n === 0) return "admin";
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = await userEmail(userId);
  if (email && admins.includes(email)) return "admin";
  return "student";
}

export const getOnboardingOptions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (demoMode()) return { demoMode: true, assignedRole: null as Role | null };
    return { demoMode: false, assignedRole: await grantableRole(context.userId, "student") };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { fullName: string; role: string; campus: string; studentNumber?: string }) => {
      const fullName = input.fullName.trim();
      if (fullName.length < 2) throw new Error("Please enter your name.");
      if (!isRole(input.role)) throw new Error("Choose a role.");
      if (!isCampus(input.campus)) throw new Error("Choose a campus.");
      return {
        fullName,
        role: input.role,
        campus: input.campus,
        studentNumber: input.studentNumber?.trim() || null,
      };
    },
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const role = await grantableRole(context.userId, data.role);
    await sql`insert into profiles (user_id, full_name, role, campus, student_number)
      values (${context.userId}, ${data.fullName}, ${role}, ${data.campus}, ${data.studentNumber})
      on conflict (user_id) do update set
        full_name = excluded.full_name,
        campus = excluded.campus,
        student_number = excluded.student_number`;
    await writeAudit(context.userId, "profile.upsert", "profile", context.userId, data.role);
    return loadProfile(context.userId);
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardData> => {
    await ensureSeeded();
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const staff = STAFF.includes(profile.role);
    const statsRows = staff
      ? await sql<{
          submissions: number;
          avg_similarity: number;
          flagged: number;
          ai_screened: number;
        }>`
          select
            count(s.id)::int as submissions,
            coalesce(avg(r.similarity_pct), 0)::int as avg_similarity,
            count(*) filter (where r.similarity_pct >= 25 or coalesce(r.ai_pct, 0) >= 60)::int as flagged,
            count(*) filter (where r.ai_pct is not null)::int as ai_screened
          from submissions s
          left join reports r on r.submission_id = s.id`
      : await sql<{
          submissions: number;
          avg_similarity: number;
          flagged: number;
          ai_screened: number;
        }>`
          select
            count(s.id)::int as submissions,
            coalesce(avg(r.similarity_pct), 0)::int as avg_similarity,
            count(*) filter (where r.similarity_pct >= 25 or coalesce(r.ai_pct, 0) >= 60)::int as flagged,
            count(*) filter (where r.ai_pct is not null)::int as ai_screened
          from submissions s
          left join reports r on r.submission_id = s.id
          where s.user_id = ${context.userId}`;

    const listSql = staff
      ? await sql<{
          id: string;
          user_id: string;
          assignment_id: string | null;
          title: string;
          filename: string;
          language: string | null;
          status: string;
          created_at: string;
          similarity_pct: number | null;
          ai_pct: number | null;
          report_id: string | null;
          author_name: string | null;
        }>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, p.full_name as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          order by s.created_at desc
          limit 12`
      : await sql<{
          id: string;
          user_id: string;
          assignment_id: string | null;
          title: string;
          filename: string;
          language: string | null;
          status: string;
          created_at: string;
          similarity_pct: number | null;
          ai_pct: number | null;
          report_id: string | null;
          author_name: string | null;
        }>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, p.full_name as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.user_id = ${context.userId}
          order by s.created_at desc
          limit 12`;

    const recent = listSql.map(mapSubmission);
    const attention = recent.filter((s) => (s.similarityPct ?? 0) >= 25 || (s.aiPct ?? 0) >= 60);
    const st = statsRows[0];
    return {
      profile,
      stats: {
        submissions: st?.submissions ?? 0,
        avgSimilarity: st?.avg_similarity ?? 0,
        flagged: st?.flagged ?? 0,
        aiScreened: st?.ai_screened ?? 0,
      },
      recent,
      attention,
      sla: { availability: 99.97, incidentsOpen: 0 },
    };
  });

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const staff = STAFF.includes(profile.role);
    const rows = staff
      ? await sql<{
          id: string;
          user_id: string;
          assignment_id: string | null;
          title: string;
          filename: string;
          language: string | null;
          status: string;
          created_at: string;
          similarity_pct: number | null;
          ai_pct: number | null;
          report_id: string | null;
          author_name: string | null;
        }>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, p.full_name as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          order by s.created_at desc
          limit 80`
      : await sql<{
          id: string;
          user_id: string;
          assignment_id: string | null;
          title: string;
          filename: string;
          language: string | null;
          status: string;
          created_at: string;
          similarity_pct: number | null;
          ai_pct: number | null;
          report_id: string | null;
          author_name: string | null;
        }>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, p.full_name as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.user_id = ${context.userId}
          order by s.created_at desc
          limit 80`;
    return rows.map(mapSubmission);
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireProfile(context.userId);
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      course_id: string;
      title: string;
      description: string | null;
      due_at: string | null;
      course_code: string;
      course_title: string;
    }>`select a.id, a.course_id, a.title, a.description, a.due_at, c.code as course_code, c.title as course_title
      from assignments a join courses c on c.id = a.course_id
      order by c.code, a.title`;
    return rows.map((r): AssignmentRow => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      description: r.description,
      dueAt: r.due_at,
      courseCode: r.course_code,
      courseTitle: r.course_title,
    }));
  });

export const listCourses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireProfile(context.userId);
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      code: string;
      title: string;
      campus: CampusId;
      owner_user_id: string;
      assignment_count: number;
    }>`select c.id, c.code, c.title, c.campus, c.owner_user_id,
        (select count(*)::int from assignments a where a.course_id = c.id) as assignment_count
      from courses c order by c.code`;
    return rows.map((r): CourseRow => ({
      id: r.id,
      code: r.code,
      title: r.title,
      campus: r.campus,
      ownerUserId: r.owner_user_id,
      assignmentCount: r.assignment_count,
    }));
  });

export const createCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { code: string; title: string; campus: string }) => {
    const code = input.code.trim().toUpperCase();
    const title = input.title.trim();
    if (code.length < 3 || title.length < 4) throw new Error("Enter a course code and title.");
    if (!isCampus(input.campus)) throw new Error("Choose a campus.");
    return { code, title, campus: input.campus };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only academic staff can create courses.");
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`insert into courses (id, code, title, campus, owner_user_id)
      values (${id}, ${data.code}, ${data.title}, ${data.campus}, ${context.userId})`;
    await writeAudit(context.userId, "course.create", "course", id, data.code);
    return { id };
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { courseId: string; title: string; description: string }) => {
    const title = input.title.trim();
    if (!input.courseId || title.length < 4) throw new Error("Enter an assignment title.");
    return {
      courseId: input.courseId,
      title,
      description: input.description.trim() || null,
    };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    if (!STAFF.includes(profile.role))
      throw new Error("Only academic staff can create assignments.");
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`insert into assignments (id, course_id, title, description)
      values (${id}, ${data.courseId}, ${data.title}, ${data.description})`;
    await writeAudit(context.userId, "assignment.create", "assignment", id, data.title);
    return { id };
  });

export const analyseSubmission = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { title: string; filename: string; text: string; assignmentId?: string | null }) => {
      const text = input.text.trim();
      if (text.length < 40)
        throw new Error("Paste or upload a longer piece of writing (40+ characters).");
      if (text.length > 80000)
        throw new Error("This document is too large. Split it or submit an extract.");
      const title =
        input.title.trim() || input.filename.replace(/\.[^.]+$/, "") || "Untitled submission";
      return {
        title,
        filename: input.filename.trim() || "pasted.txt",
        text,
        assignmentId: input.assignmentId || null,
      };
    },
  )
  .handler(async ({ context, data }) => {
    await ensureSeeded();
    const profile = await requireProfile(context.userId);
    const sql = await getSql();

    const previousRows = await sql<{ id: string; title: string; extracted_text: string }>`
      select id, title, extracted_text from submissions
      where user_id = ${context.userId}
      order by created_at desc
      limit 8`;

    const findings = analyseLocal({
      text: data.text,
      previous: previousRows.map((r) => ({ id: r.id, title: r.title, body: r.extracted_text })),
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
    await sql`insert into submissions (id, user_id, assignment_id, title, filename, extracted_text, language, status)
      values (${submissionId}, ${context.userId}, ${data.assignmentId}, ${data.title}, ${data.filename}, ${data.text}, ${findings.language.name}, ${"ready"})`;
    await sql`insert into reports (id, submission_id, similarity_pct, ai_pct, findings_json)
      values (${reportId}, ${submissionId}, ${findings.similarity}, ${findings.ai.likelihood}, ${JSON.stringify(findings)})`;
    await writeAudit(
      context.userId,
      "submission.analyse",
      "report",
      reportId,
      `${profile.role} · similarity ${findings.similarity}%`,
    );
    return { submissionId, reportId, findings };
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { reportId: string }) => {
    if (!input.reportId) throw new Error("Missing report.");
    return input;
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      submission_id: string;
      similarity_pct: number;
      ai_pct: number | null;
      findings_json: string;
      created_at: string;
      user_id: string;
      title: string;
      filename: string;
      extracted_text: string;
      assignment_id: string | null;
      author_name: string | null;
      campus: CampusId | null;
    }>`select r.id, r.submission_id, r.similarity_pct, r.ai_pct, r.findings_json, r.created_at,
        s.user_id, s.title, s.filename, s.extracted_text, s.assignment_id,
        p.full_name as author_name, p.campus
      from reports r
      join submissions s on s.id = r.submission_id
      left join profiles p on p.user_id = s.user_id
      where r.id = ${data.reportId}`;
    const row = rows[0];
    if (!row) throw new Error("Report not found.");
    if (profile.role === "student" && row.user_id !== context.userId) {
      throw new Error("You can only view your own reports.");
    }
    const findings = JSON.parse(row.findings_json) as Findings;
    await writeAudit(context.userId, "report.view", "report", row.id);
    return {
      id: row.id,
      submissionId: row.submission_id,
      createdAt: row.created_at,
      title: row.title,
      filename: row.filename,
      text: findings.obfuscation?.cleanedText || row.extracted_text,
      originalText: row.extracted_text,
      findings,
      authorName: row.author_name,
      authorUserId: row.user_id,
      campus: row.campus,
      canJudge: STAFF.includes(profile.role),
    };
  });

export const recordJudgement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reportId: string; decision: string; note: string }) => {
    const decision = input.decision.trim();
    if (!["clear", "discuss", "refer"].includes(decision)) throw new Error("Choose a decision.");
    return { reportId: input.reportId, decision, note: input.note.trim() };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only academic staff can record judgement.");
    await writeAudit(
      context.userId,
      "report.judgement",
      "report",
      data.reportId,
      `${data.decision}${data.note ? `: ${data.note}` : ""}`,
    );
    return { ok: true as const };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const rows =
      profile.role === "admin"
        ? await sql<{
            id: string;
            actor_user_id: string;
            action: string;
            entity_type: string | null;
            entity_id: string | null;
            detail: string | null;
            created_at: string;
            actor_name: string | null;
          }>`select a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id, a.detail, a.created_at, p.full_name as actor_name
            from audit_log a left join profiles p on p.user_id = a.actor_user_id
            order by a.created_at desc limit 120`
        : await sql<{
            id: string;
            actor_user_id: string;
            action: string;
            entity_type: string | null;
            entity_id: string | null;
            detail: string | null;
            created_at: string;
            actor_name: string | null;
          }>`select a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id, a.detail, a.created_at, p.full_name as actor_name
            from audit_log a left join profiles p on p.user_id = a.actor_user_id
            where a.actor_user_id = ${context.userId}
            order by a.created_at desc limit 80`;
    return rows.map((r): AuditRow => ({
      id: r.id,
      actorUserId: r.actor_user_id,
      actorName: r.actor_name,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      detail: r.detail,
      createdAt: r.created_at,
    }));
  });

export const listPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    if (profile.role !== "admin") throw new Error("Administrators only.");
    const sql = await getSql();
    return sql<{
      user_id: string;
      full_name: string;
      role: Role;
      campus: CampusId;
      student_number: string | null;
      created_at: string;
    }>`select user_id, full_name, role, campus, student_number, created_at from profiles order by created_at desc`;
  });

export const setPersonRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; role: string }) => {
    if (!isRole(input.role)) throw new Error("Invalid role.");
    return { userId: input.userId, role: input.role };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    if (profile.role !== "admin") throw new Error("Administrators only.");
    const sql = await getSql();
    await sql`update profiles set role = ${data.role} where user_id = ${data.userId}`;
    await writeAudit(context.userId, "person.role", "profile", data.userId, data.role);
    return { ok: true as const };
  });

export const listCorpus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireProfile(context.userId);
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      source_type: string;
      source_ref: string | null;
    }>`select id, title, source_type, source_ref from corpus order by title`;
  });

export const createApiClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string }) => {
    const name = input.name.trim();
    if (name.length < 3) throw new Error("Name the Moodle / API client.");
    return { name };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only staff can issue API clients.");
    const sql = await getSql();
    const raw = `org_live_${crypto.randomUUID().replace(/-/g, "")}`;
    const prefix = raw.slice(0, 16);
    const id = crypto.randomUUID();
    await sql`insert into api_clients (id, user_id, name, key_prefix)
      values (${id}, ${context.userId}, ${data.name}, ${prefix})`;
    await writeAudit(context.userId, "api.client", "api_client", id, data.name);
    return { id, prefix, token: raw };
  });

export const listApiClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    if (!STAFF.includes(profile.role)) return [];
    const sql = await getSql();
    return sql<{ id: string; name: string; key_prefix: string; created_at: string }>`
      select id, name, key_prefix, created_at from api_clients
      where user_id = ${context.userId}
      order by created_at desc`;
  });
