import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { HomoglyphExplorer } from "@/components/homoglyph-explorer";

export const Route = createFileRoute("/homoglyphs")({ component: HomoglyphsPage });

function HomoglyphsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Obfuscation agent · Spec 2.1.4
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          Homoglyphs, folded back to Latin.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
          Cyrillic а, Greek ο and a fullwidth ａ all look like the Latin letter a. A copied
          paragraph survives a casual read and breaks a checker that matches bytes. Origina folds
          each lookalike to a Latin skeleton, then runs similarity.
        </p>
        <p className="mt-3 text-sm text-muted">
          No sign-in required.{" "}
          <Link to="/zero-width" className="text-teal hover:underline">
            Zero-width lab
          </Link>
          {" · "}
          <Link to="/app/submit" className="text-teal hover:underline">
            Run a full report
          </Link>
        </p>
        <div className="mt-10">
          <HomoglyphExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
