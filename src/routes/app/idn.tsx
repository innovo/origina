import { createFileRoute, Link } from "@tanstack/react-router";
import { IdnExplorer } from "@/components/idn-explorer";

export const Route = createFileRoute("/app/idn")({ component: AppIdn });

function AppIdn() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Citation + obfuscation · IDN homograph
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">IDN lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Lookalike hosts in references. Mixed-script labels, punycode, and skeleton matches against
          WHO, PubMed, Cochrane and the rest of the watched register.
        </p>
        <Link to="/idn" className="mt-2 inline-block text-sm text-teal">
          Open the public version
        </Link>
      </header>
      <IdnExplorer />
    </div>
  );
}
