import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ALargeSmall,
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  EyeOff,
  Globe,
  GraduationCap,
  Library,
  LayoutDashboard,
  Network,
  Menu,
  Plug,
  Scale,
  ScanSearch,
  Settings,
  Shield,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { OriginaWordmark } from "@/components/brand";
import { UserButton } from "@/lib/auth/gates";
import type { Profile } from "@/lib/origina/types";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Profile["role"][];
  platformOnly?: boolean;
};

const NAV: { heading: string; items: Item[] }[] = [
  {
    heading: "Work",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/submit", label: "Submit", icon: Upload },
      { to: "/app/submissions", label: "Submissions", icon: ClipboardList },
      { to: "/app/courses", label: "Courses", icon: GraduationCap },
    ],
  },
  {
    heading: "Integrity",
    items: [
      { to: "/app/agents", label: "Detection agents", icon: ScanSearch },
      { to: "/app/zero-width", label: "Zero-width lab", icon: EyeOff },
      { to: "/app/homoglyphs", label: "Homoglyph lab", icon: ALargeSmall },
      { to: "/app/idn", label: "IDN lab", icon: Globe },
      { to: "/app/idna", label: "IDNA 2008", icon: Scale },
      { to: "/app/libraries", label: "Libraries", icon: Library },
      { to: "/app/corpus", label: "Source library", icon: Database },
      { to: "/app/moodle", label: "Moodle & API", icon: Plug },
    ],
  },
  {
    heading: "Organisation",
    items: [
      { to: "/app/organisation", label: "Organisation", icon: Building2, roles: ["teacher", "admin"] },
      { to: "/app/analytics", label: "Analytics", icon: Activity, roles: ["teacher", "admin"] },
      { to: "/app/people", label: "People", icon: Users, roles: ["admin"] },
      { to: "/app/billing", label: "Billing", icon: CreditCard, roles: ["admin"] },
      { to: "/app/audit", label: "Audit trail", icon: Shield, roles: ["teacher", "admin"] },
      { to: "/app/training", label: "How to", icon: BookOpen },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    heading: "Platform",
    items: [{ to: "/app/platform", label: "Platform", icon: Network, platformOnly: true }],
  },
];

export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const hasOrg = Boolean(profile.orgId);

  const filtered = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.platformOnly) return profile.isPlatformAdmin;
      if (!hasOrg) return false;
      return !i.roles || i.roles.includes(profile.role);
    }),
  })).filter((g) => g.items.length);

  const orgBadge = profile.orgName ? (
    <p className="mt-3 truncate rounded-xl bg-paper-2 px-3 py-2 text-xs font-medium text-ink-soft">
      {profile.orgName}
    </p>
  ) : null;

  const nav = (
    <nav className="flex flex-1 flex-col gap-6">
      {filtered.map((g) => (
        <div key={g.heading}>
          <p className="px-3 text-[14px] font-semibold uppercase tracking-[0.16em] text-muted">
            {g.heading}
          </p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((item) => {
              const active =
                item.to === "/app"
                  ? pathname === "/app" || pathname === "/app/"
                  : pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                      active
                        ? "bg-lime text-navy"
                        : "text-ink-soft hover:bg-paper-2 hover:text-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Link to="/" className="px-1">
          <OriginaWordmark />
        </Link>
        {orgBadge}
        <div className="mt-6 flex-1 overflow-y-auto pr-1">{nav}</div>
        <div className="mt-4 border-t border-line pt-4">
          <p className="px-1 text-xs text-muted">
            {[profile.campusName, profile.role === "teacher" ? "Academic staff" : profile.role]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-2 px-1">
            <UserButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
          <Link to="/app">
            <OriginaWordmark />
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-line bg-surface"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
            <div
              className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-surface p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <OriginaWordmark />
                <button
                  type="button"
                  className="size-11"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
              {orgBadge}
              <div className="mt-4">{nav}</div>
              <div className="mt-4 border-t border-line pt-4">
                <UserButton />
              </div>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

const PUBLIC_NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#why", label: "Why Origina" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/">
          <OriginaWordmark light />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-paper/75 lg:flex">
          {PUBLIC_NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-lime">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden h-11 items-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-paper hover:border-lime hover:text-lime sm:inline-flex"
          >
            Sign in
          </Link>
          <a
            href="/#demo"
            className="inline-flex h-11 items-center rounded-xl bg-lime px-4 text-sm font-semibold text-navy hover:bg-lime-deep"
          >
            Book a demo
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-xl text-paper hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-white/10 px-4 py-3 lg:hidden">
          {PUBLIC_NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-3 text-paper/85 hover:text-lime"
            >
              {n.label}
            </a>
          ))}
          <Link to="/login" className="block rounded-lg px-2 py-3 text-paper/85 hover:text-lime sm:hidden">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-navy">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-paper/70 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <OriginaWordmark light />
          <p className="mt-3">Decision support, not a verdict.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/privacy" className="hover:text-lime">
            Privacy & POPIA
          </Link>
          <a href="/#demo" className="hover:text-lime">
            Book a demo
          </a>
          <Link to="/login" className="hover:text-lime">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-paper-2" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl bg-paper-2" />
        <div className="h-32 animate-pulse rounded-2xl bg-paper-2" />
        <div className="h-32 animate-pulse rounded-2xl bg-paper-2" />
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-paper-2" />
    </div>
  );
}
