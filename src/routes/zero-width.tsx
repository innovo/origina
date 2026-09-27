import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { ZeroWidthExplorer } from "@/components/zero-width-explorer";

export const Route = createFileRoute("/zero-width")({ component: ZeroWidthPage });

function ZeroWidthPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Obfuscation agent · Spec 2.1.3
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">
          Zero-width characters, made visible.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
          A copied paragraph can look original if someone pastes a Zero Width Space, a soft hyphen
          or a Hangul filler between letters. The page still reads cleanly. A naive checker sees
          broken tokens and misses the source. Origina strips the marks first, then matches.
        </p>
        <p className="mt-3 text-sm text-muted">
          No sign-in required. Load a demo, or paste a script.{" "}
          <Link to="/app/submit" className="text-teal hover:underline">
            Run a full report
          </Link>{" "}
          when you want authorship and the audit trail as well.
        </p>
        <div className="mt-10">
          <ZeroWidthExplorer />
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}
