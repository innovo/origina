import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCorpus } from "@/lib/origina/actions";

export const Route = createFileRoute("/app/corpus")({ component: CorpusPage });

const LIBRARIES = [
  {
    name: "Institutional repository",
    detail:
      "WCCN and CEC scripts, module guides and previously submitted work. Continuously updated as cohorts submit.",
  },
  {
    name: "Online sources",
    detail: "Public web pages indexed for similarity, including college library pages.",
  },
  {
    name: "External scholarly databases",
    detail:
      "Named here for the tender: Western Cape Maternity Guidelines, SANC-aligned professional practice texts, CEC clinical manuals, and the National IPC Strategic Framework. Additional publisher feeds are contracted at go-live.",
  },
];

function CorpusPage() {
  const q = useQuery({ queryKey: ["corpus"], queryFn: () => listCorpus() });
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Content sources
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">
          Libraries Origina draws on
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Documents are checked against previously submitted work, online sources and external
          databases. The global academic repository is updated as new collections are licensed.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {LIBRARIES.map((l) => (
          <article key={l.name} className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="font-semibold">{l.name}</h2>
            <p className="mt-2 text-sm text-ink-soft">{l.detail}</p>
          </article>
        ))}
      </div>
      <section>
        <h2 className="font-display text-xl font-medium">Currently loaded</h2>
        <ul className="mt-3 divide-y divide-line rounded-[22px] border border-line bg-surface">
          {(q.data ?? []).map((c) => (
            <li key={c.id} className="px-4 py-3">
              <p className="text-sm font-medium">{c.title}</p>
              <p className="text-xs text-muted">
                {c.source_type}
                {c.source_ref ? ` · ${c.source_ref}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
