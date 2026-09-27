import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { IdnExplorer } from "@/components/idn-explorer";

export const Route = createFileRoute("/idn")({ component: IdnPage });

function IdnPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Citation + obfuscation · IDN homograph
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          Lookalike domains, decoded.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
          An internationalised domain can render as who.int or pubmed.ncbi.nlm.nih.gov while the
          registered name is a different string. That is an IDN homograph: mixed-script labels,
          punycode on the wire, or a skeleton that folds onto a watched host. Origina flags it in
          the citation list, separately from similarity.
        </p>
        <p className="mt-3 text-sm text-muted">
          No sign-in required.{" "}
          <Link to="/homoglyphs" className="text-teal hover:underline">
            Homoglyph lab
          </Link>
          {" · "}
          <Link to="/zero-width" className="text-teal hover:underline">
            Zero-width lab
          </Link>
        </p>
        <div className="mt-10">
          <IdnExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
