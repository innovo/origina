import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ReportView } from "@/components/report-view";
import { getReport, recordJudgement } from "@/lib/origina/actions";

export const Route = createFileRoute("/app/reports/$reportId")({ component: ReportPage });

function ReportPage() {
  const { reportId } = Route.useParams();
  const q = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => getReport({ data: { reportId } }),
  });
  if (q.isPending) return <p className="text-sm text-muted">Opening report…</p>;
  if (q.error || !q.data) {
    return (
      <p className="text-sm text-risk">
        {q.error instanceof Error ? q.error.message : "Not found."}
      </p>
    );
  }
  const r = q.data;
  return (
    <ReportView
      title={r.title}
      filename={r.filename}
      text={r.text}
      findings={r.findings}
      createdAt={r.createdAt}
      authorName={r.authorName}
      campus={r.campus}
      canJudge={r.canJudge}
      backTo="/app/submissions"
      onJudge={async (decision, note) => {
        await recordJudgement({ data: { reportId: r.id, decision, note } });
      }}
    />
  );
}
