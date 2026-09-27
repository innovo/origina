import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ALargeSmall,
  BookOpen,
  ClipboardList,
  Database,
  EyeOff,
  Globe,
  GraduationCap,
  Library,
  LayoutDashboard,
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
import { CAMPUSES, type Profile } from "@/lib/origina/types";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Profile["role"][];
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
      { to: "/app/corpus", label: "Source libraries", icon: Database },
      { to: "/app/moodle", label: "Moodle LMS", icon: Plug },
    ],
  },
  {
    heading: "College",
    items: [
      { to: "/app/analytics", label: "Analytics", icon: Activity, roles: ["teacher", "admin"] },
      { to: "/app/people", label: "People", icon: Users, roles: ["admin"] },
      { to: "/app/audit", label: "Audit trail", icon: Shield, roles: ["teacher", "admin"] },
      { to: "/app/training", label: "Training", icon: BookOpen },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const campus = CAMPUSES.find((c) => c.id === profile.campus);

  const filtered = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles.includes(profile.role)),
  })).filter((g) => g.items.length);

  const nav = (
    <nav className="flex flex-1 flex-col gap-6">
      {filtered.map((g) => (
        <div key={g.heading}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
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
                        ? "bg-teal text-teal-fg"
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
        <div className="mt-6 flex-1 overflow-y-auto pr-1">{nav}</div>
        <div className="mt-4 border-t border-line pt-4">
          <p className="px-1 text-xs text-muted">
            {campus?.place} · {profile.role === "teacher" ? "Academic staff" : profile.role}
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
              {nav}
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

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/">
          <OriginaWordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          <a href="/#detect" className="hover:text-ink">
            Detection
          </a>
          <Link to="/zero-width" className="hover:text-ink">
            Zero-width
          </Link>
          <Link to="/homoglyphs" className="hover:text-ink">
            Homoglyphs
          </Link>
          <Link to="/idn" className="hover:text-ink">
            IDN
          </Link>
          <Link to="/idna" className="hover:text-ink">
            IDNA
          </Link>
          <Link to="/libraries" className="hover:text-ink">
            Libraries
          </Link>
          <a href="/#moodle" className="hover:text-ink">
            Moodle
          </a>
          <a href="/#roles" className="hover:text-ink">
            Roles
          </a>
          <Link to="/sample-report" className="hover:text-ink">
            Sample report
          </Link>
        </nav>
        <Link
          to="/login"
          className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-paper-2"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <OriginaWordmark />
          <p className="mt-3 max-w-sm">
            Academic integrity platform for the Western Cape College of Nursing and the College of
            Emergency Care. POPIA-aware. Decision support, not a verdict.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/privacy" className="hover:text-ink">
            Privacy & POPIA
          </Link>
          <Link to="/zero-width" className="hover:text-ink">
            Zero-width lab
          </Link>
          <Link to="/homoglyphs" className="hover:text-ink">
            Homoglyph lab
          </Link>
          <Link to="/idn" className="hover:text-ink">
            IDN lab
          </Link>
          <Link to="/idna" className="hover:text-ink">
            IDNA 2008
          </Link>
          <Link to="/libraries" className="hover:text-ink">
            Libraries
          </Link>
          <Link to="/sample-report" className="hover:text-ink">
            Sample report
          </Link>
          <Link to="/login" className="hover:text-ink">
            Staff sign in
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
