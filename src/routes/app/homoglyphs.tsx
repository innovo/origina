import { createFileRoute, Link } from "@tanstack/react-router";
import { HomoglyphExplorer } from "@/components/homoglyph-explorer";

export const Route = createFileRoute("/app/homoglyphs")({ component: AppHomoglyphs });

function AppHomoglyphs() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Obfuscation agent · Spec 2.1.4
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Homoglyph lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Lookalike letters from Cyrillic, Greek and fullwidth Latin. Origina folds them to a
          skeleton, then matches. Same lab as the public explorer.
        </p>
        <Link to="/homoglyphs" className="mt-2 inline-block text-sm text-teal">
          Open the public version
        </Link>
      </header>
      <HomoglyphExplorer />
    </div>
  );
}
