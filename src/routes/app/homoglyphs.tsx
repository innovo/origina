import { createFileRoute, Link } from "@tanstack/react-router";
import { HomoglyphExplorer } from "@/components/homoglyph-explorer";

export const Route = createFileRoute("/app/homoglyphs")({ component: AppHomoglyphs });

function AppHomoglyphs() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Homoglyph lab</h1>
        <Link to="/homoglyphs" className="mt-2 inline-block text-sm text-lime-ink">
          Open the public version
        </Link>
      </header>
      <HomoglyphExplorer />
    </div>
  );
}
