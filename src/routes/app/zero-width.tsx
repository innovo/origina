import { createFileRoute, Link } from "@tanstack/react-router";
import { ZeroWidthExplorer } from "@/components/zero-width-explorer";

export const Route = createFileRoute("/app/zero-width")({ component: AppZeroWidth });

function AppZeroWidth() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Zero-width lab</h1>
        <Link to="/zero-width" className="mt-2 inline-block text-sm text-lime-ink">
          Open the public version
        </Link>
      </header>
      <ZeroWidthExplorer />
    </div>
  );
}
