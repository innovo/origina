import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Fingerprint,
  Languages,
  Lock,
  Plug,
  ScanSearch,
  Shield,
  Type,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { HighlightedDoc } from "@/components/highlighted-doc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SAMPLE_TEXTS } from "@/lib/origina/corpus";
import { analyseLocal } from "@/lib/origina/engine";

export const Route = createFileRoute("/")({ component: Home });

const FEATURES = [
  { icon: ScanSearch, title: "Copied and paraphrased text" },
  { icon: Fingerprint, title: "Hidden characters and lookalike letters" },
  { icon: Type, title: "AI-written text indicator" },
  { icon: Languages, title: "Translated text and fake citations" },
  { icon: Plug, title: "Moodle and REST API" },
  { icon: Shield, title: "Full audit trail" },
  { icon: Building2, title: "Separate workspace per institution" },
  { icon: Lock, title: "POPIA-aware and private" },
];

function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <Hero />
      <Features />
      <QuickScan />
      <PublicFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <div>
        <h1 className="font-display text-[2.725rem] leading-[1.05] font-medium tracking-tight text-ink sm:text-6xl">
          Originality,
          <br />
          <em className="not-italic underline decoration-lime decoration-[0.12em] underline-offset-[0.14em]">
            verified.
          </em>
        </h1>
        <p className="mt-6 max-w-md text-lg text-ink-soft">
          Plagiarism, AI and concealment checks for schools, colleges and universities.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/login">
              Sign in <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sample-report">Sample report</Link>
          </Button>
        </div>
      </div>
      <HeroPaper />
    </section>
  );
}

function HeroPaper() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[32px] bg-lime/15" />
      <article className="rounded-[28px] border border-line bg-surface-2 p-6 shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex items-center justify-between text-[14px] uppercase tracking-[0.16em] text-muted">
          <span>Reflection essay</span>
          <span className="text-lime-ink">Similarity 41%</span>
        </div>
        <p className="paper-rule mt-5 text-[17px] leading-7 text-ink-soft">
          The{" "}
          <mark className="mark-direct rounded-sm">
            primary survey in major trauma follows a strict ABCDE sequence
          </mark>{" "}
          so that immediately life-threatening problems are found and treated.{" "}
          <mark className="mark-semantic rounded-sm">
            Breathing assessment includes inspection of chest wall movement
          </mark>
          .
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
          <div>
            <dt className="text-[14px] uppercase tracking-wider text-muted">Similarity</dt>
            <dd className="font-display text-xl text-ink">41%</dd>
          </div>
          <div>
            <dt className="text-[14px] uppercase tracking-wider text-muted">AI indicator</dt>
            <dd className="font-display text-xl text-ink">12%</dd>
          </div>
          <div>
            <dt className="text-[14px] uppercase tracking-wider text-muted">Hidden marks</dt>
            <dd className="font-display text-xl text-ok">0</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}

function Features() {
  return (
    <section id="detect" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight">What it checks</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-4"
            >
              <f.icon className="size-5 shrink-0 text-lime-ink" />
              <span className="font-medium text-ink">{f.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuickScan() {
  const [text, setText] = useState(SAMPLE_TEXTS[1].text);
  const [active, setActive] = useState(SAMPLE_TEXTS[1].id);
  const findings = useMemo(() => analyseLocal({ text }), [text]);

  return (
    <section id="scan" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="font-display text-3xl font-medium tracking-tight">Try it</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {SAMPLE_TEXTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActive(s.id);
              setText(s.text);
            }}
            className={`h-10 rounded-full px-3 text-sm ${
              active === s.id ? "bg-ink text-paper" : "border border-line bg-surface-2 text-ink-soft"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <Textarea
            aria-label="Text to check"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-64"
          />
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-lime-soft px-3 py-1 text-navy">
              Similarity {findings.similarity}%
            </span>
            <span className="rounded-full bg-risk-soft px-3 py-1 text-risk">
              Hidden marks {findings.obfuscation.flags.length}
            </span>
            <span className="rounded-full bg-paper-2 px-3 py-1 text-ink-soft">
              {findings.language.name}
            </span>
          </div>
        </div>
        <div>
          <HighlightedDoc
            text={findings.obfuscation.cleanedText}
            spans={findings.spans}
            className="max-h-[28rem] overflow-auto"
          />
          {findings.sources[0] && (
            <p className="mt-3 text-sm text-muted">
              Closest source: {findings.sources[0].title} ({findings.sources[0].overlapPct}%)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
