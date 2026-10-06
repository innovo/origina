import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { listSubmissions } from "@/lib/origina/actions";
import { formatDate, scoreTone } from "@/lib/utils";

export const Route = createFileRoute("/app/submissions")({ component: Submissions });

function Submissions() {
  const q = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Submissions</h1>
      </header>
      {q.isPending && <p className="text-sm text-muted">Loading…</p>}
      {q.data && q.data.length === 0 && (
        <p className="rounded-[22px] border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          Nothing here yet.{" "}
          <Link to="/app/submit" className="text-lime-ink">
            Submit a first piece of writing.
          </Link>
        </p>
      )}
      {q.data && q.data.length > 0 && (
        <div className="overflow-x-auto rounded-[22px] border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Similarity</th>
                <th className="px-4 py-3 font-medium">AI</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {s.reportId ? (
                      <Link
                        to="/app/reports/$reportId"
                        params={{ reportId: s.reportId }}
                        className="font-medium text-ink hover:text-lime-ink"
                      >
                        {s.title}
                      </Link>
                    ) : (
                      s.title
                    )}
                    <p className="text-xs text-muted">{s.filename}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{s.authorName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Pct n={s.similarityPct} />
                  </td>
                  <td className="px-4 py-3">
                    <Pct n={s.aiPct} />
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Pct({ n }: { n: number | null }) {
  if (n == null) return <Badge tone="muted">-</Badge>;
  const tone = scoreTone(n);
  return <Badge tone={tone === "ok" ? "ok" : tone === "warn" ? "warn" : "risk"}>{n}%</Badge>;
}
