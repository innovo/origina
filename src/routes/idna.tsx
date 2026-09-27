import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { IdnaExplorer } from "@/components/idna-explorer";

export const Route = createFileRoute("/idna")({ component: IdnaPage });

function IdnaPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Citation URLs · IDNA2008
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          IDNA2008, beside the 2003 mapping it replaced.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
          Punycode is only the encoding. IDNA2008 (RFC 5890–5894) decides which characters may
          appear in a domain, and it no longer maps ß to ss or strips a Zero Width Joiner. Browsers
          speak UTS #46 nontransitional — the IDNA2008-compatible profile. Origina records both
          A-labels when they disagree.
        </p>
        <p className="mt-3 text-sm text-muted">
          <Link to="/idn" className="text-teal hover:underline">
            IDN homograph lab
          </Link>
          {" · "}
          <Link to="/zero-width" className="text-teal hover:underline">
            Zero-width lab
          </Link>
        </p>
        <div className="mt-10">
          <IdnaExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
