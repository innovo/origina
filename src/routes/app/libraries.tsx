import { createFileRoute, Link } from "@tanstack/react-router";
import { LibrariesExplorer } from "@/components/libraries-explorer";

export const Route = createFileRoute("/app/libraries")({ component: AppLibraries });

function AppLibraries() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Obfuscation agent · library survey
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">
          Homoglyph libraries
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          UTS39 raw versus the prose-safe fold Origina actually runs. unicode-confusables is wired;
          the others were surveyed and left out on purpose.
        </p>
        <Link to="/libraries" className="mt-2 inline-block text-sm text-teal">
          Open the public version
        </Link>
      </header>
      <LibrariesExplorer />
    </div>
  );
}
