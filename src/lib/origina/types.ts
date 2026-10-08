import type { BillingState } from "./billing";
export type Role = "student" | "teacher" | "admin";

export type CampusId = string;

export type SourceType = "institutional" | "previous" | "web" | "journal" | "textbook" | "self";

export type MatchKind = "direct" | "partial" | "semantic" | "self";

export type Profile = {
  userId: string;
  fullName: string;
  role: Role;
  campus: CampusId | null;
  campusName: string | null;
  studentNumber: string | null;
  createdAt: string;
  orgId: string | null;
  orgName: string | null;
  orgShortName: string | null;
  isPlatformAdmin: boolean;
  /** The organisation's subscription (null when not in an organisation). */
  billing: BillingState | null;
};

export type Campus = {
  id: string;
  orgId: string;
  name: string;
  detail: string | null;
};

export type Organization = {
  id: string;
  name: string;
  shortName: string;
  joinCode: string;
  emailDomains: string;
  adminEmails: string;
  createdAt: string;
};

export type OrganizationSummary = Organization & {
  people: number;
  submissions: number;
  campuses: number;
  staff: number;
  billing: BillingState;
};

export type ObfuscationFlag = {
  kind: "zero-width" | "homoglyph" | "bidi" | "control" | "hidden" | "metadata" | "idn";
  label: string;
  count: number;
  samples: string[];
};

export type ObfuscationResult = {
  score: number;
  flags: ObfuscationFlag[];
  cleanedText: string;
  originalLength: number;
  strippedCount: number;
};

export type TextSpan = {
  start: number;
  end: number;
  kind: MatchKind;
  sourceId: string;
};

export type SourceHit = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceRef: string | null;
  overlapPct: number;
  matchedWords: number;
  kind: MatchKind;
  excerpt: string;
};

export type CitationFinding = {
  text: string;
  issue: string | null;
  ok: boolean;
};

export type AiPassage = {
  quote: string;
  reason: string;
};

export type Findings = {
  similarity: number;
  methods: {
    direct: number;
    partial: number;
    semantic: number;
    self: number;
  };
  language: { code: string; name: string; confidence: number };
  obfuscation: ObfuscationResult;
  spans: TextSpan[];
  sources: SourceHit[];
  citations: CitationFinding[];
  wordCount: number;
  ai: {
    likelihood: number | null;
    confidence: "low" | "medium" | "high" | null;
    summary: string | null;
    indicators: string[];
    passages: AiPassage[];
    translationSuspicion: boolean;
    paraphraseSuspicion: boolean;
    unavailable: boolean;
  };
  disclaimer: string;
};

export type SubmissionRow = {
  id: string;
  userId: string;
  assignmentId: string | null;
  title: string;
  filename: string;
  language: string | null;
  status: string;
  createdAt: string;
  similarityPct: number | null;
  aiPct: number | null;
  reportId: string | null;
  authorName: string | null;
};

export type CourseRow = {
  id: string;
  code: string;
  title: string;
  campus: CampusId | null;
  campusName: string | null;
  ownerUserId: string;
  assignmentCount: number;
};

export type AssignmentRow = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  courseCode: string;
  courseTitle: string;
};

export type AuditRow = {
  id: string;
  actorUserId: string;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
};

export type DashboardData = {
  profile: Profile;
  stats: {
    submissions: number;
    avgSimilarity: number;
    flagged: number;
    aiScreened: number;
  };
  recent: SubmissionRow[];
  attention: SubmissionRow[];
  sla: { availability: number; incidentsOpen: number };
};

export const DISCLAIMER =
  "Indicators are not proof of misconduct. Staff make the final decision.";

export const ROLE_META: Record<Role, { label: string; hint: string }> = {
  student: {
    label: "Student",
    hint: "Submit assignments and view your own originality reports.",
  },
  teacher: {
    label: "Academic staff",
    hint: "Review submissions, run checks, and record academic judgement.",
  },
  admin: {
    label: "Administrator",
    hint: "Configure your organisation, campuses, people, Moodle and analytics.",
  },
};
