import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CORPUS } from "./corpus";
import { runAnalysis, writeAudit } from "./analysis";
import { hashApiKey } from "./api-keys";
import { billingState, DEFAULT_SEAT_PRICE_CENTS, rand, TRIAL_DAYS, type BillingState } from "./billing";
import type {
  AssignmentRow,
  AuditRow,
  Campus,
  CourseRow,
  DashboardData,
  Findings,
  Organization,
  OrganizationSummary,
  Profile,
  Role,
  SubmissionRow,
} from "./types";

const STAFF: Role[] = ["teacher", "admin"];

function isRole(v: string): v is Role {
  return v === "student" || v === "teacher" || v === "admin";
}

/* ───────────────────────── Tenancy helpers ───────────────────────── */

type OrgProfile = Profile & { orgId: string };

function csvList(v: string | null | undefined): string[] {
  return (v ?? "")
    .split(/[,\s;]+/)
    .map((x) => x.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function normaliseCsv(v: string | null | undefined): string {
  return Array.from(new Set(csvList(v))).join(", ");
}

/** 8-character join code without look-alike characters (0/O, 1/I/L). */
function newJoinCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    full_name: string;
    role: Role;
    campus: string | null;
    campus_name: string | null;
    student_number: string | null;
    created_at: string;
    org_id: string | null;
    org_name: string | null;
    org_short_name: string | null;
    is_platform_admin: boolean;
    plan: string | null;
    billing_status: string | null;
    trial_ends_at: string | null;
    paid_until: string | null;
    seats: number | null;
    seat_price_cents: number | null;
  }>`select p.user_id, p.full_name, p.role, p.campus, c.name as campus_name, p.student_number,
        p.created_at, p.org_id, o.name as org_name, o.short_name as org_short_name, p.is_platform_admin,
        o.plan, o.billing_status, o.trial_ends_at, o.paid_until, o.seats, o.seat_price_cents
      from profiles p
      left join organizations o on o.id = p.org_id
      left join campuses c on c.id = p.campus and c.org_id = p.org_id
      where p.user_id = ${userId}`;
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    fullName: r.full_name,
    role: r.role,
    campus: r.campus,
    campusName: r.campus_name,
    studentNumber: r.student_number,
    createdAt: r.created_at,
    orgId: r.org_name ? r.org_id : null,
    orgName: r.org_name,
    orgShortName: r.org_short_name,
    isPlatformAdmin: Boolean(r.is_platform_admin),
    billing: r.org_name ? billingState(r) : null,
  };
}

async function requireProfile(userId: string): Promise<Profile> {
  const p = await loadProfile(userId);
  if (!p) throw new Error("Complete onboarding before using Origina.");
  return p;
}

/** Profile that belongs to an organisation: every tenant query is scoped by its orgId. */
async function requireOrgProfile(
  userId: string,
  opts: { allowLocked?: boolean } = {},
): Promise<OrgProfile> {
  const p = await requireProfile(userId);
  if (!p.orgId) {
    throw new Error(
      p.isPlatformAdmin
        ? "Open a client organisation from the Platform page first."
        : "Your account is not linked to an organisation. Ask your administrator for a join code.",
    );
  }
  // Innovo platform admins never pay; everyone else needs an active subscription.
  if (!opts.allowLocked && !p.isPlatformAdmin && p.billing?.locked) {
    throw new Error(
      p.role === "admin"
        ? "Your subscription is not active. Open Billing to subscribe."
        : "Your institution's subscription is not active. Ask your administrator to renew it.",
    );
  }
  return p as OrgProfile;
}

function requirePlatformAdmin(p: Profile) {
  if (!p.isPlatformAdmin) throw new Error("Innovo platform administrators only.");
}

function requireOrgAdmin(p: OrgProfile) {
  if (p.role !== "admin" && !p.isPlatformAdmin) throw new Error("Administrators only.");
}

async function userEmail(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  return rows[0]?.email?.toLowerCase() ?? null;
}

/**
 * Innovo platform admins: anyone in PLATFORM_ADMIN_EMAILS (ADMIN_EMAILS is kept
 * as a fallback for older deployments), plus the very first account on a fresh
 * install so the platform can always be set up.
 */
async function isPlatformAdminUser(userId: string): Promise<boolean> {
  const sql = await getSql();
  const existing = await sql<{ is_platform_admin: boolean }>`
    select is_platform_admin from profiles where user_id = ${userId}`;
  if (existing[0]?.is_platform_admin) return true;
  const allowed = csvList(process.env.PLATFORM_ADMIN_EMAILS || process.env.ADMIN_EMAILS);
  const email = await userEmail(userId);
  if (email && allowed.includes(email)) return true;
  const [{ n }] = await sql<{ n: number }>`
    select count(*)::int as n from profiles where user_id <> ${userId}`;
  return n === 0;
}

function mapOrg(r: {
  id: string;
  name: string;
  short_name: string;
  join_code: string;
  email_domains: string;
  admin_emails: string;
  created_at: string;
}): Organization {
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    joinCode: r.join_code,
    emailDomains: r.email_domains,
    adminEmails: r.admin_emails,
    createdAt: r.created_at,
  };
}

async function loadOrg(orgId: string): Promise<Organization | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    short_name: string;
    join_code: string;
    email_domains: string;
    admin_emails: string;
    created_at: string;
  }>`select id, name, short_name, join_code, email_domains, admin_emails, created_at
      from organizations where id = ${orgId}`;
  return rows[0] ? mapOrg(rows[0]) : null;
}

async function loadCampuses(orgId: string): Promise<Campus[]> {
  const sql = await getSql();
  const rows = await sql<{ id: string; org_id: string; name: string; detail: string | null }>`
    select id, org_id, name, detail from campuses where org_id = ${orgId} order by name`;
  return rows.map((r) => ({ id: r.id, orgId: r.org_id, name: r.name, detail: r.detail }));
}

/** Organisation whose registered email domains include this user's domain. */
async function orgForEmail(userId: string): Promise<Organization | null> {
  const email = await userEmail(userId);
  const domain = email?.split("@")[1];
  if (!domain) return null;
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    short_name: string;
    join_code: string;
    email_domains: string;
    admin_emails: string;
    created_at: string;
  }>`select id, name, short_name, join_code, email_domains, admin_emails, created_at
      from organizations order by created_at`;
  const match = rows.find((r) => csvList(r.email_domains).includes(domain));
  return match ? mapOrg(match) : null;
}

async function orgByJoinCode(code: string): Promise<Organization | null> {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 4) return null;
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    short_name: string;
    join_code: string;
    email_domains: string;
    admin_emails: string;
    created_at: string;
  }>`select id, name, short_name, join_code, email_domains, admin_emails, created_at
      from organizations where upper(join_code) = ${clean}`;
  return rows[0] ? mapOrg(rows[0]) : null;
}

/** Public shape of an organisation for the onboarding picker (no codes or emails). */
async function orgChoice(org: Organization) {
  return {
    id: org.id,
    name: org.name,
    shortName: org.shortName,
    campuses: await loadCampuses(org.id),
  };
}

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  const sql = await getSql();
  const [{ n }] = await sql<{ n: number }>`select count(*)::int as n from corpus`;
  if (n === 0) {
    // Shared sample library (org_id null) visible to every organisation.
    for (const c of CORPUS) {
      await sql`insert into corpus (id, title, source_type, source_ref, body)
        values (${c.id}, ${c.title}, ${c.sourceType}, ${c.sourceRef}, ${c.body})
        on conflict (id) do nothing`;
    }
  }
  seeded = true;
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

/* ───────────────────────── Profile & onboarding ───────────────────────── */

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

/**
 * The role a NEW member of an organisation gets. Platform admins and anyone in
 * the organisation's admin emails become admin; everyone else is a student until
 * an administrator promotes them on the People page.
 */
async function grantableRole(userId: string, org: Organization, requested: Role): Promise<Role> {
  if (demoMode()) return requested;
  if (await isPlatformAdminUser(userId)) return "admin";
  const email = await userEmail(userId);
  if (email && csvList(org.adminEmails).includes(email)) return "admin";
  return "student";
}

export const getOnboardingOptions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const platformAdmin = await isPlatformAdminUser(context.userId);
    const matched = await orgForEmail(context.userId);
    const sql = await getSql();
    const all = platformAdmin
      ? await sql<{ id: string; name: string; short_name: string }>`
          select id, name, short_name from organizations order by name`
      : [];
    return {
      demoMode: demoMode(),
      isPlatformAdmin: platformAdmin,
      matchedOrg: matched ? await orgChoice(matched) : null,
      organizations: all.map((o) => ({ id: o.id, name: o.name, shortName: o.short_name })),
    };
  });

/** Look up an organisation by the join code its administrator shared. */
export const findOrganizationByCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { joinCode: string }) => ({ joinCode: String(input.joinCode ?? "") }))
  .handler(async ({ data }) => {
    const org = await orgByJoinCode(data.joinCode);
    if (!org) throw new Error("That join code was not recognised. Check it with your administrator.");
    return orgChoice(org);
  });

export const getOrganizationCampuses = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orgId: string }) => ({ orgId: String(input.orgId ?? "") }))
  .handler(async ({ context, data }) => {
    if (!(await isPlatformAdminUser(context.userId))) throw new Error("Not allowed.");
    return loadCampuses(data.orgId);
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      fullName: string;
      role: string;
      campus?: string | null;
      studentNumber?: string;
      joinCode?: string;
      orgId?: string | null;
      newOrgName?: string;
      newOrgShortName?: string;
      billingCompany?: string;
      billingVat?: string;
      billingAddress?: string;
      billingEmail?: string;
    }) => {
      const fullName = input.fullName.trim();
      if (fullName.length < 2) throw new Error("Please enter your name.");
      if (!isRole(input.role)) throw new Error("Choose a role.");
      return {
        fullName,
        role: input.role,
        campus: input.campus?.trim() || null,
        studentNumber: input.studentNumber?.trim() || null,
        joinCode: input.joinCode?.trim() || "",
        orgId: input.orgId?.trim() || null,
        newOrgName: input.newOrgName?.trim().slice(0, 160) || "",
        newOrgShortName: input.newOrgShortName?.trim().slice(0, 40) || "",
        billing: {
          company: input.billingCompany?.trim().slice(0, 160) || "",
          vat: input.billingVat?.trim().slice(0, 40) || "",
          address: input.billingAddress?.trim().slice(0, 400) || "",
          email: input.billingEmail?.trim().toLowerCase().slice(0, 200) || "",
        },
      };
    },
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await loadProfile(context.userId);
    const platformAdmin = await isPlatformAdminUser(context.userId);

    // Resolve the organisation. An existing member keeps theirs (no hopping).
    let org: Organization | null = existing?.orgId ? await loadOrg(existing.orgId) : null;
    if (!org && data.joinCode) org = await orgByJoinCode(data.joinCode);
    if (!org && data.orgId) {
      const candidate = await loadOrg(data.orgId);
      const matched = await orgForEmail(context.userId);
      if (candidate && (platformAdmin || matched?.id === candidate.id)) org = candidate;
    }
    let createdOwnOrg = false;
    if (!org && data.newOrgName.length >= 3) {
      if (!platformAdmin) {
        if (!data.billing.company) throw new Error("Enter the company or institution name for invoices.");
        if (!data.billing.address) throw new Error("Enter a billing address.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billing.email)) {
          throw new Error("Enter a valid billing email.");
        }
      }
      org = await insertOrganization(
        context.userId,
        {
          name: data.newOrgName,
          shortName: data.newOrgShortName || data.newOrgName,
          emailDomains: "",
          adminEmails: "",
          campuses: [],
        },
        { selfServe: !platformAdmin, billing: data.billing },
      );
      createdOwnOrg = !platformAdmin;
    }
    if (!org) {
      throw new Error(
        data.joinCode
          ? "That join code was not recognised. Check it with your administrator."
          : "Enter the join code from your institution's administrator.",
      );
    }

    const campuses = await loadCampuses(org.id);
    let campus: string | null = null;
    if (campuses.length) {
      if (!data.campus || !campuses.some((c) => c.id === data.campus)) {
        throw new Error("Choose a campus.");
      }
      campus = data.campus;
    }

    const role = existing?.orgId
      ? existing.role
      : createdOwnOrg
        ? "admin"
        : await grantableRole(context.userId, org, data.role);
    if (!existing?.orgId && role !== "student" && !platformAdmin) await assertSeatAvailable(org.id);
    await sql`insert into profiles (user_id, full_name, role, campus, student_number, org_id, is_platform_admin)
      values (${context.userId}, ${data.fullName}, ${role}, ${campus}, ${data.studentNumber}, ${org.id}, ${platformAdmin})
      on conflict (user_id) do update set
        full_name = excluded.full_name,
        campus = excluded.campus,
        student_number = excluded.student_number,
        org_id = coalesce(profiles.org_id, excluded.org_id),
        role = case when profiles.org_id is null then excluded.role else profiles.role end,
        is_platform_admin = profiles.is_platform_admin or excluded.is_platform_admin`;
    await writeAudit(context.userId, org.id, "profile.upsert", "profile", context.userId, role);
    return loadProfile(context.userId);
  });

/* ───────────────────────── Organisations (platform + org admin) ───────────────────────── */

type OrgInput = {
  name: string;
  shortName: string;
  emailDomains: string;
  adminEmails: string;
  campuses: string[];
};

function validateOrgInput(input: Partial<OrgInput>): OrgInput {
  const name = String(input.name ?? "").trim();
  if (name.length < 3) throw new Error("Enter the organisation's name.");
  const shortName = String(input.shortName ?? "").trim() || name;
  if (shortName.length > 40) throw new Error("Keep the short name under 40 characters.");
  const campuses = (input.campuses ?? [])
    .map((c) => String(c).trim())
    .filter((c) => c.length >= 2)
    .slice(0, 50);
  return {
    name,
    shortName,
    emailDomains: normaliseCsv(input.emailDomains),
    adminEmails: normaliseCsv(input.adminEmails),
    campuses,
  };
}

type BillingDetails = { company: string; vat: string; address: string; email: string };

async function insertOrganization(
  actorUserId: string,
  input: OrgInput,
  opts: { selfServe?: boolean; billing?: BillingDetails } = {},
): Promise<Organization> {
  const sql = await getSql();
  const id = crypto.randomUUID();
  let joinCode = newJoinCode();
  for (let i = 0; i < 5 && (await orgByJoinCode(joinCode)); i++) joinCode = newJoinCode();
  // Self-registered institutions start a free trial. Ones Innovo registers are
  // managed Institution accounts.
  const plan = opts.selfServe ? "trial" : "institution";
  const status = opts.selfServe ? "trialing" : "active";
  const trialEnds = opts.selfServe ? new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString() : null;
  const b = opts.billing;
  await sql`insert into organizations (id, name, short_name, join_code, email_domains, admin_emails, created_by,
      plan, billing_status, trial_ends_at, seat_price_cents,
      billing_company, billing_vat, billing_address, billing_email)
    values (${id}, ${input.name}, ${input.shortName}, ${joinCode}, ${input.emailDomains}, ${input.adminEmails}, ${actorUserId},
      ${plan}, ${status}, ${trialEnds}, ${seatPriceCents()},
      ${b?.company || null}, ${b?.vat || null}, ${b?.address || null}, ${b?.email || null})`;
  for (const name of input.campuses) {
    await sql`insert into campuses (id, org_id, name) values (${crypto.randomUUID()}, ${id}, ${name})`;
  }
  await writeAudit(actorUserId, id, "organization.create", "organization", id, input.name);
  return (await loadOrg(id))!;
}

export const listOrganizations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OrganizationSummary[]> => {
    requirePlatformAdmin(await requireProfile(context.userId));
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      short_name: string;
      join_code: string;
      email_domains: string;
      admin_emails: string;
      created_at: string;
      people: number;
      submissions: number;
      campuses: number;
      staff: number;
      plan: string | null;
      billing_status: string | null;
      trial_ends_at: string | null;
      paid_until: string | null;
      seats: number | null;
      seat_price_cents: number | null;
    }>`select o.id, o.name, o.short_name, o.join_code, o.email_domains, o.admin_emails, o.created_at,
        o.plan, o.billing_status, o.trial_ends_at, o.paid_until, o.seats, o.seat_price_cents,
        (select count(*)::int from profiles p where p.org_id = o.id) as people,
        (select count(*)::int from profiles p where p.org_id = o.id and p.role in ('teacher', 'admin')
           and not p.is_platform_admin) as staff,
        (select count(*)::int from submissions s where s.org_id = o.id) as submissions,
        (select count(*)::int from campuses c where c.org_id = o.id) as campuses
      from organizations o order by o.name`;
    return rows.map((r) => ({
      ...mapOrg(r),
      people: r.people,
      submissions: r.submissions,
      campuses: r.campuses,
      staff: r.staff,
      billing: billingState(r),
    }));
  });

export const createOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Partial<OrgInput>) => validateOrgInput(input))
  .handler(async ({ context, data }) => {
    requirePlatformAdmin(await requireProfile(context.userId));
    return insertOrganization(context.userId, data);
  });

/** Platform admins step into a client organisation as its administrator (support). */
export const switchOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orgId: string }) => ({ orgId: String(input.orgId ?? "") }))
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    requirePlatformAdmin(profile);
    const org = await loadOrg(data.orgId);
    if (!org) throw new Error("Organisation not found.");
    const sql = await getSql();
    await sql`update profiles set org_id = ${org.id}, campus = null, role = 'admin'
      where user_id = ${context.userId}`;
    await writeAudit(context.userId, org.id, "organization.enter", "organization", org.id, org.name);
    return loadProfile(context.userId);
  });

/** The signed-in user's organisation, its campuses, and (for staff) the join code. */
export const getMyOrganization = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    const org = (await loadOrg(profile.orgId))!;
    const staff = STAFF.includes(profile.role) || profile.isPlatformAdmin;
    const admin = profile.role === "admin" || profile.isPlatformAdmin;
    return {
      id: org.id,
      name: org.name,
      shortName: org.shortName,
      joinCode: staff ? org.joinCode : null,
      emailDomains: admin ? org.emailDomains : null,
      adminEmails: admin ? org.adminEmails : null,
      canEdit: admin,
      campuses: await loadCampuses(org.id),
    };
  });

export const updateMyOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Partial<OrgInput>) => validateOrgInput(input))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    await sql`update organizations set name = ${data.name}, short_name = ${data.shortName},
        email_domains = ${data.emailDomains}, admin_emails = ${data.adminEmails}
      where id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "organization.update", "organization", profile.orgId, data.name);
    return { ok: true as const };
  });

export const regenerateJoinCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    let code = newJoinCode();
    for (let i = 0; i < 5 && (await orgByJoinCode(code)); i++) code = newJoinCode();
    await sql`update organizations set join_code = ${code} where id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "organization.join_code", "organization", profile.orgId);
    return { joinCode: code };
  });

export const listCampuses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
    return loadCampuses(profile.orgId);
  });

export const addCampus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string; detail?: string }) => {
    const name = String(input.name ?? "").trim();
    if (name.length < 2) throw new Error("Enter the campus name.");
    return { name, detail: String(input.detail ?? "").trim() || null };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`insert into campuses (id, org_id, name, detail)
      values (${id}, ${profile.orgId}, ${data.name}, ${data.detail})`;
    await writeAudit(context.userId, profile.orgId, "campus.create", "campus", id, data.name);
    return { id };
  });

export const removeCampus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    const rows = await sql<{ name: string }>`
      select name from campuses where id = ${data.id} and org_id = ${profile.orgId}`;
    if (!rows[0]) throw new Error("Campus not found.");
    await sql`update profiles set campus = null where campus = ${data.id} and org_id = ${profile.orgId}`;
    await sql`update courses set campus = null where campus = ${data.id} and org_id = ${profile.orgId}`;
    await sql`delete from campuses where id = ${data.id} and org_id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "campus.delete", "campus", data.id, rows[0].name);
    return { ok: true as const };
  });

/* ───────────────────────── Work (all scoped to the user's organisation) ───────────────────────── */

type SubmissionSqlRow = {
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
};

type StatsRow = {
  submissions: number;
  avg_similarity: number;
  flagged: number;
  ai_screened: number;
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardData> => {
    await ensureSeeded();
    const profile = await requireOrgProfile(context.userId);
    const sql = await getSql();
    const staff = STAFF.includes(profile.role);
    const statsRows = staff
      ? await sql<StatsRow>`
          select
            count(s.id)::int as submissions,
            coalesce(avg(r.similarity_pct), 0)::int as avg_similarity,
            count(*) filter (where r.similarity_pct >= 25 or coalesce(r.ai_pct, 0) >= 60)::int as flagged,
            count(*) filter (where r.ai_pct is not null)::int as ai_screened
          from submissions s
          left join reports r on r.submission_id = s.id
          where s.org_id = ${profile.orgId}`
      : await sql<StatsRow>`
          select
            count(s.id)::int as submissions,
            coalesce(avg(r.similarity_pct), 0)::int as avg_similarity,
            count(*) filter (where r.similarity_pct >= 25 or coalesce(r.ai_pct, 0) >= 60)::int as flagged,
            count(*) filter (where r.ai_pct is not null)::int as ai_screened
          from submissions s
          left join reports r on r.submission_id = s.id
          where s.org_id = ${profile.orgId} and s.user_id = ${context.userId}`;

    const listSql = staff
      ? await sql<SubmissionSqlRow>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, coalesce(p.full_name, s.author_name) as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.org_id = ${profile.orgId}
          order by s.created_at desc
          limit 12`
      : await sql<SubmissionSqlRow>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, coalesce(p.full_name, s.author_name) as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.org_id = ${profile.orgId} and s.user_id = ${context.userId}
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
    const profile = await requireOrgProfile(context.userId);
    const sql = await getSql();
    const staff = STAFF.includes(profile.role);
    const rows = staff
      ? await sql<SubmissionSqlRow>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, coalesce(p.full_name, s.author_name) as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.org_id = ${profile.orgId}
          order by s.created_at desc
          limit 80`
      : await sql<SubmissionSqlRow>`
          select s.id, s.user_id, s.assignment_id, s.title, s.filename, s.language, s.status, s.created_at,
            r.similarity_pct, r.ai_pct, r.id as report_id, coalesce(p.full_name, s.author_name) as author_name
          from submissions s
          left join reports r on r.submission_id = s.id
          left join profiles p on p.user_id = s.user_id
          where s.org_id = ${profile.orgId} and s.user_id = ${context.userId}
          order by s.created_at desc
          limit 80`;
    return rows.map(mapSubmission);
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
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
      where c.org_id = ${profile.orgId}
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
    const profile = await requireOrgProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      code: string;
      title: string;
      campus: string | null;
      campus_name: string | null;
      owner_user_id: string;
      assignment_count: number;
    }>`select c.id, c.code, c.title, c.campus, cp.name as campus_name, c.owner_user_id,
        (select count(*)::int from assignments a where a.course_id = c.id) as assignment_count
      from courses c
      left join campuses cp on cp.id = c.campus and cp.org_id = c.org_id
      where c.org_id = ${profile.orgId}
      order by c.code`;
    return rows.map((r): CourseRow => ({
      id: r.id,
      code: r.code,
      title: r.title,
      campus: r.campus,
      campusName: r.campus_name,
      ownerUserId: r.owner_user_id,
      assignmentCount: r.assignment_count,
    }));
  });

export const createCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { code: string; title: string; campus?: string | null }) => {
    const code = input.code.trim().toUpperCase();
    const title = input.title.trim();
    if (code.length < 3 || title.length < 4) throw new Error("Enter a course code and title.");
    return { code, title, campus: input.campus?.trim() || null };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only academic staff can create courses.");
    const campuses = await loadCampuses(profile.orgId);
    const campus = data.campus && campuses.some((c) => c.id === data.campus) ? data.campus : null;
    if (campuses.length && !campus) throw new Error("Choose a campus.");
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`insert into courses (id, code, title, campus, owner_user_id, org_id)
      values (${id}, ${data.code}, ${data.title}, ${campus}, ${context.userId}, ${profile.orgId})`;
    await writeAudit(context.userId, profile.orgId, "course.create", "course", id, data.code);
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
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role))
      throw new Error("Only academic staff can create assignments.");
    const sql = await getSql();
    const course = await sql<{ id: string }>`
      select id from courses where id = ${data.courseId} and org_id = ${profile.orgId}`;
    if (!course[0]) throw new Error("Course not found.");
    const id = crypto.randomUUID();
    await sql`insert into assignments (id, course_id, title, description)
      values (${id}, ${data.courseId}, ${data.title}, ${data.description})`;
    await writeAudit(context.userId, profile.orgId, "assignment.create", "assignment", id, data.title);
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
    const profile = await requireOrgProfile(context.userId);
    return runAnalysis({
      orgId: profile.orgId,
      userId: context.userId,
      role: profile.role,
      authorName: null,
      title: data.title,
      filename: data.filename,
      text: data.text,
      assignmentId: data.assignmentId,
    });
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { reportId: string }) => {
    if (!input.reportId) throw new Error("Missing report.");
    return input;
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
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
      campus_name: string | null;
    }>`select r.id, r.submission_id, r.similarity_pct, r.ai_pct, r.findings_json, r.created_at,
        s.user_id, s.title, s.filename, s.extracted_text, s.assignment_id,
        coalesce(p.full_name, s.author_name) as author_name, c.name as campus_name
      from reports r
      join submissions s on s.id = r.submission_id
      left join profiles p on p.user_id = s.user_id
      left join campuses c on c.id = p.campus and c.org_id = s.org_id
      where r.id = ${data.reportId} and s.org_id = ${profile.orgId}`;
    const row = rows[0];
    if (!row) throw new Error("Report not found.");
    if (profile.role === "student" && row.user_id !== context.userId) {
      throw new Error("You can only view your own reports.");
    }
    const findings = JSON.parse(row.findings_json) as Findings;
    const judgements = STAFF.includes(profile.role)
      ? await sql<{
          id: string;
          decision: string;
          note: string | null;
          created_at: string;
          by_name: string | null;
        }>`select j.id, j.decision, j.note, j.created_at, p.full_name as by_name
          from judgements j left join profiles p on p.user_id = j.user_id
          where j.report_id = ${row.id} and j.org_id = ${profile.orgId}
          order by j.created_at desc`
      : [];
    await writeAudit(context.userId, profile.orgId, "report.view", "report", row.id);
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
      campusName: row.campus_name,
      canJudge: STAFF.includes(profile.role),
      judgements: judgements.map((j) => ({
        id: j.id,
        decision: j.decision,
        note: j.note,
        createdAt: j.created_at,
        byName: j.by_name,
      })),
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
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only academic staff can record judgement.");
    const sql = await getSql();
    const ok = await sql<{ id: string }>`
      select r.id from reports r join submissions s on s.id = r.submission_id
      where r.id = ${data.reportId} and s.org_id = ${profile.orgId}`;
    if (!ok[0]) throw new Error("Report not found.");
    await sql`insert into judgements (id, org_id, report_id, user_id, decision, note)
      values (${crypto.randomUUID()}, ${profile.orgId}, ${data.reportId}, ${context.userId}, ${data.decision}, ${data.note || null})`;
    await writeAudit(
      context.userId,
      profile.orgId,
      "report.judgement",
      "report",
      data.reportId,
      `${data.decision}${data.note ? `: ${data.note}` : ""}`,
    );
    return { ok: true as const };
  });

type AuditSqlRow = {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
  actor_name: string | null;
};

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
    const sql = await getSql();
    const rows =
      profile.role === "admin"
        ? await sql<AuditSqlRow>`select a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id, a.detail, a.created_at, p.full_name as actor_name
            from audit_log a left join profiles p on p.user_id = a.actor_user_id
            where a.org_id = ${profile.orgId}
            order by a.created_at desc limit 120`
        : await sql<AuditSqlRow>`select a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id, a.detail, a.created_at, p.full_name as actor_name
            from audit_log a left join profiles p on p.user_id = a.actor_user_id
            where a.org_id = ${profile.orgId} and a.actor_user_id = ${context.userId}
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
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    return sql<{
      user_id: string;
      full_name: string;
      email: string | null;
      role: Role;
      campus: string | null;
      campus_name: string | null;
      student_number: string | null;
      created_at: string;
    }>`select p.user_id, p.full_name, u.email, p.role, p.campus, c.name as campus_name,
        p.student_number, p.created_at
      from profiles p
      left join "user" u on u.id = p.user_id
      left join campuses c on c.id = p.campus and c.org_id = p.org_id
      where p.org_id = ${profile.orgId}
      order by p.created_at desc`;
  });

export const setPersonRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; role: string }) => {
    if (!isRole(input.role)) throw new Error("Invalid role.");
    return { userId: input.userId, role: input.role };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    requireOrgAdmin(profile);
    const sql = await getSql();
    const target = await sql<{ user_id: string }>`
      select user_id from profiles where user_id = ${data.userId} and org_id = ${profile.orgId}`;
    if (!target[0]) throw new Error("Person not found in your organisation.");
    if (data.role !== "student") {
      const current = await sql<{ role: string }>`select role from profiles where user_id = ${data.userId}`;
      if (current[0]?.role === "student") await assertSeatAvailable(profile.orgId);
    }
    await sql`update profiles set role = ${data.role}
      where user_id = ${data.userId} and org_id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "person.role", "profile", data.userId, data.role);
    return { ok: true as const };
  });

export const listCorpus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      source_type: string;
      source_ref: string | null;
      org_id: string | null;
    }>`select id, title, source_type, source_ref, org_id from corpus
      where org_id is null or org_id = ${profile.orgId}
      order by org_id nulls last, title`;
  });

export const addLibraryDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; text: string; sourceRef?: string }) => {
    const title = String(input.title ?? "").trim();
    const text = String(input.text ?? "").trim();
    if (title.length < 2) throw new Error("Enter a title.");
    if (text.length < 40) throw new Error("Add at least 40 characters of text.");
    if (text.length > 200000) throw new Error("This document is too large.");
    return { title, text, sourceRef: String(input.sourceRef ?? "").trim() || null };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only staff can add sources.");
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`insert into corpus (id, org_id, title, source_type, source_ref, body)
      values (${id}, ${profile.orgId}, ${data.title}, ${"institutional"}, ${data.sourceRef}, ${data.text})`;
    await writeAudit(context.userId, profile.orgId, "library.add", "corpus", id, data.title);
    return { id };
  });

export const removeLibraryDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only staff can remove sources.");
    const sql = await getSql();
    await sql`delete from corpus where id = ${data.id} and org_id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "library.remove", "corpus", data.id);
    return { ok: true as const };
  });

export const createApiClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { name: string }) => {
    const name = input.name.trim();
    if (name.length < 3) throw new Error("Name the Moodle / API client.");
    return { name };
  })
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only staff can issue API clients.");
    const sql = await getSql();
    const raw = `org_live_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const prefix = raw.slice(0, 16);
    const id = crypto.randomUUID();
    await sql`insert into api_clients (id, org_id, user_id, name, key_prefix, key_hash)
      values (${id}, ${profile.orgId}, ${context.userId}, ${data.name}, ${prefix}, ${await hashApiKey(raw)})`;
    await writeAudit(context.userId, profile.orgId, "api.client", "api_client", id, data.name);
    return { id, prefix, token: raw };
  });

export const listApiClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) return [];
    const sql = await getSql();
    return sql<{ id: string; name: string; key_prefix: string; created_at: string }>`
      select id, name, key_prefix, created_at from api_clients
      where org_id = ${profile.orgId} and revoked_at is null and key_hash is not null
      order by created_at desc`;
  });

export const revokeApiClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId);
    if (!STAFF.includes(profile.role)) throw new Error("Only staff can revoke API keys.");
    const sql = await getSql();
    await sql`update api_clients set revoked_at = now()
      where id = ${data.id} and org_id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "api.revoke", "api_client", data.id);
    return { ok: true as const };
  });

/* ───────────────────────── Demo requests (public homepage) ───────────────────────── */

export type DemoRequest = {
  id: string;
  name: string;
  email: string;
  institution: string;
  role: string | null;
  phone: string | null;
  message: string | null;
  createdAt: string;
};

function clip(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export const submitDemoRequest = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      email: string;
      institution: string;
      role?: string;
      phone?: string;
      message?: string;
      website?: string;
    }) => ({
      name: clip(input.name, 120),
      email: clip(input.email, 200).toLowerCase(),
      institution: clip(input.institution, 200),
      role: clip(input.role, 120),
      phone: clip(input.phone, 40),
      message: clip(input.message, 2000),
      website: clip(input.website, 200),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Hidden "website" field: real visitors leave it empty, bots fill it in.
    if (data.website) return { ok: true };
    if (!data.name) throw new Error("Please enter your name.");
    if (!data.institution) throw new Error("Please enter your institution.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Please enter a valid email address.");
    }
    const sql = await getSql();
    const recent = await sql<{ n: number }>`select count(*)::int as n from demo_requests
      where email = ${data.email} and created_at > now() - interval '1 day'`;
    if ((recent[0]?.n ?? 0) >= 3) {
      throw new Error("We already have your request. We'll be in touch soon.");
    }
    await sql`insert into demo_requests (id, name, email, institution, role, phone, message)
      values (${crypto.randomUUID()}, ${data.name}, ${data.email}, ${data.institution},
        ${data.role || null}, ${data.phone || null}, ${data.message || null})`;
    return { ok: true };
  });

export const listDemoRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DemoRequest[]> => {
    requirePlatformAdmin(await requireProfile(context.userId));
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      email: string;
      institution: string;
      role: string | null;
      phone: string | null;
      message: string | null;
      created_at: string;
    }>`select id, name, email, institution, role, phone, message, created_at
      from demo_requests order by created_at desc limit 200`;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      institution: r.institution,
      role: r.role,
      phone: r.phone,
      message: r.message,
      createdAt: r.created_at,
    }));
  });

/* ───────────────────────── Billing & subscriptions ───────────────────────── */

/** Pro price per staff seat per month, in cents (PRO_SEAT_PRICE_RAND, default R89). */
function seatPriceCents(): number {
  const rands = Number(process.env.PRO_SEAT_PRICE_RAND?.trim());
  return Number.isFinite(rands) && rands > 0 ? Math.round(rands * 100) : DEFAULT_SEAT_PRICE_CENTS;
}

/** Staff seats in use: teachers and administrators (Innovo staff don't count). */
async function staffCount(orgId: string): Promise<number> {
  const sql = await getSql();
  const [{ n }] = await sql<{ n: number }>`select count(*)::int as n from profiles
    where org_id = ${orgId} and role in ('teacher', 'admin') and not is_platform_admin`;
  return n;
}

async function loadBilling(orgId: string) {
  const sql = await getSql();
  const rows = await sql<{
    name: string;
    plan: string | null;
    billing_status: string | null;
    trial_ends_at: string | null;
    paid_until: string | null;
    seats: number | null;
    seat_price_cents: number | null;
    payfast_token: string | null;
    billing_company: string | null;
    billing_vat: string | null;
    billing_address: string | null;
    billing_email: string | null;
  }>`select name, plan, billing_status, trial_ends_at, paid_until, seats, seat_price_cents, payfast_token,
        billing_company, billing_vat, billing_address, billing_email
      from organizations where id = ${orgId}`;
  const r = rows[0];
  if (!r) throw new Error("Organisation not found.");
  return { row: r, state: billingState(r) };
}

/** Paid plans with a seat count can't have more staff than seats. */
async function assertSeatAvailable(orgId: string): Promise<void> {
  const { state } = await loadBilling(orgId);
  if (state.plan === "trial" || state.seats <= 0) return;
  if ((await staffCount(orgId)) >= state.seats) {
    throw new Error(
      `All ${state.seats} paid staff seats are in use. An administrator can add seats on the Billing page.`,
    );
  }
}

async function appBaseUrl(): Promise<string> {
  const configured = process.env.BETTER_AUTH_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const { getRequest } = await import("@tanstack/react-start/server");
  const req = getRequest();
  return req ? new URL(req.url).origin : "http://localhost:8080";
}

export type BillingOverview = {
  orgName: string;
  state: BillingState;
  staff: number;
  seatPriceCents: number;
  monthlyCents: number;
  hasSubscription: boolean;
  canManage: boolean;
  paymentsEnabled: boolean;
  details: { company: string; vat: string; address: string; email: string };
  payments: { id: string; status: string; amountCents: number | null; createdAt: string }[];
};

export const getBilling = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingOverview> => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    const { row, state } = await loadBilling(profile.orgId);
    const canManage = profile.role === "admin" || profile.isPlatformAdmin;
    const { payfastConfig } = await import("./payfast.server");
    const sql = await getSql();
    const payments = canManage
      ? await sql<{ id: string; payment_status: string; amount_gross_cents: number | null; created_at: string }>`
          select id, payment_status, amount_gross_cents, created_at from billing_payments
          where org_id = ${profile.orgId} order by created_at desc limit 24`
      : [];
    const price = state.plan === "pro" ? state.seatPriceCents : seatPriceCents();
    return {
      orgName: row.name,
      state,
      staff: await staffCount(profile.orgId),
      seatPriceCents: price,
      monthlyCents: price * Math.max(state.seats, 1),
      hasSubscription: Boolean(row.payfast_token) && state.plan === "pro" && state.status === "active",
      canManage,
      paymentsEnabled: payfastConfig().configured,
      details: canManage
        ? {
            company: row.billing_company ?? "",
            vat: row.billing_vat ?? "",
            address: row.billing_address ?? "",
            email: row.billing_email ?? "",
          }
        : { company: "", vat: "", address: "", email: "" },
      payments: payments.map((p) => ({
        id: p.id,
        status: p.payment_status,
        amountCents: p.amount_gross_cents,
        createdAt: p.created_at,
      })),
    };
  });

export const saveBillingDetails = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { company: string; vat: string; address: string; email: string }) => ({
    company: String(input.company ?? "").trim().slice(0, 160),
    vat: String(input.vat ?? "").trim().slice(0, 40),
    address: String(input.address ?? "").trim().slice(0, 400),
    email: String(input.email ?? "").trim().toLowerCase().slice(0, 200),
  }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    requireOrgAdmin(profile);
    if (!data.company) throw new Error("Enter the company or institution name for invoices.");
    if (!data.address) throw new Error("Enter a billing address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error("Enter a valid billing email.");
    const sql = await getSql();
    await sql`update organizations set billing_company = ${data.company}, billing_vat = ${data.vat || null},
        billing_address = ${data.address}, billing_email = ${data.email}
      where id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "billing.details", "organization", profile.orgId);
    return { ok: true as const };
  });

/** Start a PayFast monthly subscription for the chosen number of staff seats. */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { seats: number }) => ({ seats: Math.floor(Number(input.seats)) }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    requireOrgAdmin(profile);
    const { row, state } = await loadBilling(profile.orgId);
    if (state.plan === "institution") {
      throw new Error("Your institution is billed by Innovo Networks. Contact us to make changes.");
    }
    if (row.payfast_token && state.plan === "pro" && state.status === "active") {
      throw new Error("You already have an active subscription. Use Change seats instead.");
    }
    if (!row.billing_company || !row.billing_address || !row.billing_email) {
      throw new Error("Save your billing details first.");
    }
    const staff = await staffCount(profile.orgId);
    if (!Number.isFinite(data.seats) || data.seats < Math.max(staff, 1) || data.seats > 1000) {
      throw new Error(`Choose at least ${Math.max(staff, 1)} seats (you have ${staff} staff).`);
    }
    const price = seatPriceCents();
    const amountCents = price * data.seats;
    const id = crypto.randomUUID();
    const sql = await getSql();
    await sql`insert into billing_checkouts (id, org_id, user_id, seats, amount_cents)
      values (${id}, ${profile.orgId}, ${context.userId}, ${data.seats}, ${amountCents})`;
    await sql`update organizations set seat_price_cents = ${price} where id = ${profile.orgId}`;
    const email = (await userEmail(context.userId)) ?? row.billing_email;
    const [first, ...rest] = profile.fullName.split(/\s+/);
    const { buildSubscriptionCheckout } = await import("./payfast.server");
    const checkout = buildSubscriptionCheckout({
      baseUrl: await appBaseUrl(),
      checkoutId: id,
      orgId: profile.orgId,
      seats: data.seats,
      amountCents,
      firstName: first || profile.fullName,
      lastName: rest.join(" ") || first || "",
      email,
    });
    await writeAudit(context.userId, profile.orgId, "billing.checkout", "billing", id, rand(amountCents));
    return checkout;
  });

/** Change the number of seats on an active Pro subscription (new amount from the next bill). */
export const changeSeats = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { seats: number }) => ({ seats: Math.floor(Number(input.seats)) }))
  .handler(async ({ context, data }) => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    requireOrgAdmin(profile);
    const { row, state } = await loadBilling(profile.orgId);
    if (!row.payfast_token || state.plan !== "pro" || state.status !== "active") {
      throw new Error("There's no active subscription to change.");
    }
    const staff = await staffCount(profile.orgId);
    if (!Number.isFinite(data.seats) || data.seats < Math.max(staff, 1) || data.seats > 1000) {
      throw new Error(`Choose at least ${Math.max(staff, 1)} seats (you have ${staff} staff).`);
    }
    const amountCents = state.seatPriceCents * data.seats;
    const { updatePayfastAmount } = await import("./payfast.server");
    await updatePayfastAmount(row.payfast_token, amountCents);
    const sql = await getSql();
    await sql`update organizations set seats = ${data.seats} where id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "billing.seats", "organization", profile.orgId, String(data.seats));
    return { ok: true as const, amountCents };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireOrgProfile(context.userId, { allowLocked: true });
    requireOrgAdmin(profile);
    const { row, state } = await loadBilling(profile.orgId);
    if (!row.payfast_token || state.plan !== "pro") throw new Error("There's no subscription to cancel.");
    const { cancelPayfastSubscription } = await import("./payfast.server");
    await cancelPayfastSubscription(row.payfast_token);
    const sql = await getSql();
    await sql`update organizations set billing_status = 'cancelled' where id = ${profile.orgId}`;
    await writeAudit(context.userId, profile.orgId, "billing.cancel", "organization", profile.orgId);
    return { ok: true as const };
  });

/** Innovo platform admins manage Institution accounts (invoice / EFT) by hand. */
export const setOrgBilling = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { orgId: string; plan: string; status: string; paidUntil?: string | null; seats?: number }) => {
      const plan = ["trial", "pro", "institution"].includes(input.plan) ? input.plan : null;
      const status = ["trialing", "active", "cancelled", "expired"].includes(input.status) ? input.status : null;
      if (!plan || !status) throw new Error("Choose a valid plan and status.");
      const paidUntil = input.paidUntil ? new Date(input.paidUntil) : null;
      if (paidUntil && Number.isNaN(paidUntil.getTime())) throw new Error("Enter a valid date.");
      return {
        orgId: String(input.orgId ?? ""),
        plan,
        status,
        paidUntil: paidUntil ? paidUntil.toISOString() : null,
        seats: Math.max(0, Math.floor(Number(input.seats ?? 0)) || 0),
      };
    },
  )
  .handler(async ({ context, data }) => {
    requirePlatformAdmin(await requireProfile(context.userId));
    const sql = await getSql();
    const trialEnds = data.plan === "trial" ? data.paidUntil : null;
    await sql`update organizations set plan = ${data.plan}, billing_status = ${data.status},
        paid_until = ${data.plan === "trial" ? null : data.paidUntil},
        trial_ends_at = coalesce(${trialEnds}::timestamptz, trial_ends_at),
        seats = ${data.seats}
      where id = ${data.orgId}`;
    await writeAudit(context.userId, data.orgId, "billing.manual", "organization", data.orgId,
      `${data.plan}/${data.status}`);
    return { ok: true as const };
  });
