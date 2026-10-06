import { createFileRoute, Link } from "@tanstack/react-router";
import { IdnaExplorer } from "@/components/idna-explorer";

export const Route = createFileRoute("/app/idna")({ component: AppIdna });

function AppIdna() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">IDNA 2008</h1>
        <Link to="/idna" className="mt-2 inline-block text-sm text-lime-ink">
          Open the public version
        </Link>
      </header>
      <IdnaExplorer />
    </div>
  );
}
