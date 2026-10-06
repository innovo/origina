import { createFileRoute, Link } from "@tanstack/react-router";
import { IdnExplorer } from "@/components/idn-explorer";

export const Route = createFileRoute("/app/idn")({ component: AppIdn });

function AppIdn() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">IDN lab</h1>
        <Link to="/idn" className="mt-2 inline-block text-sm text-lime-ink">
          Open the public version
        </Link>
      </header>
      <IdnExplorer />
    </div>
  );
}
