import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAudit } from "@/lib/origina/actions";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/audit")({ component: Audit });

function Audit() {
  const q = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Investigations
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Audit trail</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Checks performed, reports opened, and academic judgements — enough to support a
          disciplinary file. Administrators see the whole college; staff see their own actions.
        </p>
      </header>
      <ul className="divide-y divide-line rounded-[22px] border border-line bg-surface">
        {(q.data ?? []).map((row) => (
          <li key={row.id} className="px-4 py-3">
            <p className="text-sm font-medium">{row.action}</p>
            <p className="text-xs text-muted">
              {row.actorName ?? "User"} · {formatDate(row.createdAt)}
              {row.detail ? ` · ${row.detail}` : ""}
            </p>
          </li>
        ))}
        {q.data?.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted">No events yet.</li>
        )}
      </ul>
    </div>
  );
}
