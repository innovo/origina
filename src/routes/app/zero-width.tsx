import { createFileRoute, Link } from "@tanstack/react-router";
import { ZeroWidthExplorer } from "@/components/zero-width-explorer";

export const Route = createFileRoute("/app/zero-width")({ component: AppZeroWidth });

function AppZeroWidth() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Obfuscation agent · Spec 2.1.3
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Zero-width lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Invisible marks that split copied words so a naive checker misses the source. Origina
          strips them, then matches. This page is the same lab as the public explorer.
        </p>
        <Link to="/zero-width" className="mt-2 inline-block text-sm text-teal">
          Open the public version
        </Link>
      </header>
      <ZeroWidthExplorer />
    </div>
  );
}
