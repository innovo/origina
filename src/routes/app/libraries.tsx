import { createFileRoute, Link } from "@tanstack/react-router";
import { LibrariesExplorer } from "@/components/libraries-explorer";

export const Route = createFileRoute("/app/libraries")({ component: AppLibraries });

function AppLibraries() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Homoglyph libraries
        </h1>
        <Link to="/libraries" className="mt-2 inline-block text-sm text-lime-ink">
          Open the public version
        </Link>
      </header>
      <LibrariesExplorer />
    </div>
  );
}
