import { createFileRoute, Link } from "@tanstack/react-router";
import { IdnaExplorer } from "@/components/idna-explorer";

export const Route = createFileRoute("/app/idna")({ component: AppIdna });

function AppIdna() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Citation URLs · IDNA2008
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">IDNA 2008</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          RFC 5890–5894 plus UTS #46. Transitional (2003) mapping versus nontransitional
          registration, including CONTEXTJ joiners that still turn up in citation URLs.
        </p>
        <Link to="/idna" className="mt-2 inline-block text-sm text-teal">
          Open the public version
        </Link>
      </header>
      <IdnaExplorer />
    </div>
  );
}
