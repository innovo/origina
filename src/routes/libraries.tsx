import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { LibrariesExplorer } from "@/components/libraries-explorer";

export const Route = createFileRoute("/libraries")({ component: LibrariesPage });

function LibrariesPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Obfuscation agent · library survey
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          Homoglyph libraries, compared on the same sentence.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
          Unicode UTS39 is the standard. The npm packages that wrap it — unicode-confusables,
          confusables, the ENS fork — are built for identifiers. Run them on Beauchamp and they
          rewrite m as rn. Origina keeps the official table for Cyrillic and Greek, and refuses the
          ASCII confusables that would mutilate an essay.
        </p>
        <p className="mt-3 text-sm text-muted">
          <Link to="/homoglyphs" className="text-teal hover:underline">
            Homoglyph lab
          </Link>
          {" · "}
          <Link to="/idn" className="text-teal hover:underline">
            IDN lab
          </Link>
        </p>
        <div className="mt-10">
          <LibrariesExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
