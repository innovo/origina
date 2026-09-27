import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, listSubmissions } from "@/lib/origina/actions";

export const Route = createFileRoute("/app/analytics")({ component: Analytics });

function Analytics() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const list = useQuery({ queryKey: ["submissions"], queryFn: () => listSubmissions() });
  const buckets = [
    { name: "0–14", n: 0 },
    { name: "15–24", n: 0 },
    { name: "25–49", n: 0 },
    { name: "50+", n: 0 },
  ];
  for (const s of list.data ?? []) {
    const v = s.similarityPct ?? 0;
    if (v < 15) buckets[0].n += 1;
    else if (v < 25) buckets[1].n += 1;
    else if (v < 50) buckets[2].n += 1;
    else buckets[3].n += 1;
  }
  const stats = dash.data?.stats;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Administrators & staff
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Analytics</h1>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Checks" value={stats?.submissions ?? 0} />
        <Stat label="Mean similarity" value={`${stats?.avgSimilarity ?? 0}%`} />
        <Stat label="AI-screened" value={stats?.aiScreened ?? 0} />
      </section>
      <section className="rounded-[22px] border border-line bg-surface p-5">
        <h2 className="font-semibold">Similarity distribution</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} />
              <YAxis
                allowDecimals={false}
                stroke="var(--color-muted)"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="n" fill="var(--color-teal)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl tabular-nums">{value}</p>
    </article>
  );
}
