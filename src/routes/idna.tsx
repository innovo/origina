import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { IdnaExplorer } from "@/components/idna-explorer";

export const Route = createFileRoute("/idna")({ component: IdnaPage });

function IdnaPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-display max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          IDNA2008 vs 2003.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">How a domain is encoded under each standard.</p>
        <nav className="mt-6 flex flex-wrap gap-2 text-sm">
          {[
            ["/zero-width", "Zero-width"],
            ["/homoglyphs", "Homoglyphs"],
            ["/idn", "IDN"],
            ["/idna", "IDNA"],
            ["/libraries", "Libraries"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft hover:border-lime-deep"
              activeProps={{ className: "!bg-ink !text-paper !border-ink" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <IdnaExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
