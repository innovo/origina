import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/origina/actions";
import { ROLE_META } from "@/lib/origina/types";
import { formatDate, scoreTone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  if (q.isPending) {
    return <p className="text-sm text-muted">Loading your workspace…</p>;
  }
  if (q.error || !q.data) {
    return <p className="text-sm text-risk">Could not load the dashboard.</p>;
  }
  const { profile, stats, recent, attention } = q.data;
  const staff = profile.role !== "student";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {[profile.orgShortName, profile.campusName, ROLE_META[profile.role].label]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">
            {staff ? "Integrity desk" : `Good day, ${profile.fullName.split(" ")[0]}`}
          </h1>
        </div>
        <Button asChild>
          <Link to="/app/submit">
            <Upload className="size-4" /> New check
          </Link>
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Submissions", stats.submissions, "Processed"],
          ["Average similarity", `${stats.avgSimilarity}%`, "Across reports"],
          ["Needs attention", stats.flagged, "≥ 25% or high AI"],
          ["AI screened", stats.aiScreened, "With an AI indicator"],
        ].map(([label, value, hint]) => (
          <article
            key={label}
            className="rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-page)]"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="font-display mt-2 text-3xl tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </article>
        ))}
      </section>

      {staff && attention.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-medium">Attention queue</h2>
          <ul className="mt-3 divide-y divide-line rounded-[22px] border border-line bg-surface">
            {attention.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted">
                    {s.authorName ?? "Student"} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToneBadge n={s.similarityPct} prefix="Sim" />
                  {s.reportId && (
                    <Link
                      to="/app/reports/$reportId"
                      params={{ reportId: s.reportId }}
                      className="text-sm text-lime-ink hover:underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium">Recent reports</h2>
          <Link to="/app/submissions" className="flex items-center gap-1 text-sm text-lime-ink">
            All submissions <ArrowRight className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 rounded-[22px] border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            No submissions yet. Start with a pasted paragraph or a sample from the submit page.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-[22px] border border-line bg-surface">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted">
                    {s.filename} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ToneBadge n={s.similarityPct} prefix="Sim" />
                  <ToneBadge n={s.aiPct} prefix="AI" />
                  {s.reportId && (
                    <Link
                      to="/app/reports/$reportId"
                      params={{ reportId: s.reportId }}
                      className="text-sm text-lime-ink"
                    >
                      Report
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ToneBadge({ n, prefix }: { n: number | null; prefix: string }) {
  if (n == null) return <Badge tone="muted">{prefix} -</Badge>;
  const tone = scoreTone(n);
  return (
    <Badge tone={tone === "ok" ? "ok" : tone === "warn" ? "warn" : "risk"}>
      {prefix} {n}%
    </Badge>
  );
}
