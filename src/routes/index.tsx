import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  Fingerprint,
  Languages,
  Lock,
  Plug,
  ScanSearch,
  Shield,
  Type,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { HighlightedDoc } from "@/components/highlighted-doc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SAMPLE_TEXTS } from "@/lib/origina/corpus";
import { analyseLocal } from "@/lib/origina/engine";
import { CAMPUSES } from "@/lib/origina/types";

export const Route = createFileRoute("/")({ component: Home });

const CAPABILITIES = [
  {
    icon: ScanSearch,
    title: "Copied and paraphrased text",
    body: "Direct, partial and meaning-based matching against the institutional repository, previous submissions and external libraries.",
  },
  {
    icon: Fingerprint,
    title: "Concealment and spoofing",
    body: "Zero-width characters, homoglyph substitution, hidden text, font tricks, bidi overrides and non-printing control characters.",
  },
  {
    icon: Type,
    title: "AI-generated writing",
    body: "Authorship indicators sit beside similarity, never inside it. Staff still make the finding.",
  },
  {
    icon: Languages,
    title: "Translation and rework",
    body: "Flags text that appears translated or rewritten to hide a source, including fabricated citations.",
  },
  {
    icon: Plug,
    title: "Moodle, native",
    body: "LTI and API so assignments check on upload, scores appear in Moodle, and detailed reports stay one click away.",
  },
  {
    icon: Shield,
    title: "Audit that can stand in a hearing",
    body: "Every check, view and academic judgement is written to a trail sufficient for disciplinary process.",
  },
];

const AGENTS = [
  { name: "Similarity", duty: "Shingle matching, self-plagiarism, source links" },
  { name: "Obfuscation", duty: "Zero-width, homoglyphs, hidden markup" },
  { name: "Authorship", duty: "AI-assisted writing as decision support" },
  { name: "Citation", duty: "Impossible years and invented references" },
];

function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <Hero />
      <Campuses />
      <Capabilities />
      <QuickScan />
      <MoodleBand />
      <Roles />
      <Compliance />
      <PublicFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          WCCN · CEC · 1 April 2027
        </p>
        <h1 className="font-display mt-4 text-[2.6rem] leading-[1.05] font-medium tracking-tight text-ink sm:text-6xl">
          Originality,
          <br />
          <em className="italic">verified.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Origina is the academic integrity service for the Western Cape College of Nursing and the
          College of Emergency Care. It reads a script the way an examiner does — against the
          library, against last term’s submissions, and against the tricks that hide a copy.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/login">
              Open the workspace <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sample-report">View a sample report</Link>
          </Button>
        </div>
        <p className="mt-6 max-w-md text-sm text-muted">
          Install from the browser onto iPhone, iPad, Android and desktop. Same workspace as the
          website — no separate store binary required for this release.
        </p>
      </div>
      <HeroPaper />
    </section>
  );
}

function HeroPaper() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[32px] bg-teal/8" />
      <article className="rounded-[28px] border border-line bg-surface-2 p-6 shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>ECC110 · reflection</span>
          <span className="text-teal">Similarity 41%</span>
        </div>
        <h2 className="font-display mt-4 text-2xl text-ink">Primary survey in major trauma</h2>
        <p className="paper-rule mt-5 text-[15px] leading-7 text-ink-soft">
          The{" "}
          <mark className="mark-direct rounded-sm">
            primary survey in major trauma follows a strict ABCDE sequence
          </mark>{" "}
          so that immediately life-threatening problems are found and treated. I watched the airway
          clinician keep manual in-line stabilisation while clothes were cut.{" "}
          <mark className="mark-semantic rounded-sm">
            Breathing assessment includes inspection of chest wall movement
          </mark>{" "}
          — that line is from the skills compendium, not from me.
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Similarity</dt>
            <dd className="font-display text-xl text-ink">41%</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">AI indicator</dt>
            <dd className="font-display text-xl text-ink">12%</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Obfuscation</dt>
            <dd className="font-display text-xl text-ok">0</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}

function Campuses() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Four campuses, one service
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {CAMPUSES.map((c) => (
            <li key={c.id}>
              <span className="font-medium text-ink">{c.place}</span>
              <span className="text-muted"> · {c.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section id="detect" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Detection</p>
      <h2 className="font-display mt-2 max-w-2xl text-3xl font-medium tracking-tight sm:text-4xl">
        Built for the ways academic work is actually copied.
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <article
            key={c.title}
            className="rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-page)]"
          >
            <c.icon className="size-5 text-teal" />
            <h3 className="mt-4 font-semibold text-ink">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link to="/zero-width" className="font-medium text-teal hover:underline">
          Open the zero-width lab →
        </Link>
        <span className="text-muted"> Invisible marks. </span>
        <Link to="/homoglyphs" className="font-medium text-teal hover:underline">
          Homoglyph lab →
        </Link>
        <span className="text-muted"> Lookalike letters. </span>
        <Link to="/idn" className="font-medium text-teal hover:underline">
          IDN lab →
        </Link>
        <span className="text-muted"> Lookalike domains. </span>
        <Link to="/libraries" className="font-medium text-teal hover:underline">
          Library survey →
        </Link>
        <span className="text-muted"> UTS39 vs Origina on the same sentence.</span>
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-4">
        {AGENTS.map((a) => (
          <li key={a.name} className="rounded-2xl bg-teal-deep px-4 py-4 text-teal-fg">
            <p className="font-display text-lg">{a.name}</p>
            <p className="mt-1 text-xs text-teal-fg/75">{a.duty}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuickScan() {
  const [text, setText] = useState(SAMPLE_TEXTS[1].text);
  const [active, setActive] = useState(SAMPLE_TEXTS[1].id);
  const findings = useMemo(() => analyseLocal({ text }), [text]);

  return (
    <section id="scan" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Try it without signing in
        </p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Paste a paragraph. Watch the agents work.
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Similarity and obfuscation run in the browser against the nursing and emergency-care
          library. Sign in to store a report, run the authorship agent, and send scores to Moodle.
        </p>
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
                active === s.id
                  ? "bg-ink text-paper"
                  : "border border-line bg-surface-2 text-ink-soft"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-64" />
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-teal-soft px-3 py-1 text-teal-deep">
                Similarity {findings.similarity}%
              </span>
              <span className="rounded-full bg-risk-soft px-3 py-1 text-risk">
                Obfuscation {findings.obfuscation.flags.length} flags
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
                Closest source: {findings.sources[0].title} ({findings.sources[0].overlapPct}%).
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MoodleBand() {
  return (
    <section
      id="moodle"
      className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Moodle LMS</p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Check on upload. Score in the assignment. Report one click away.
        </h2>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
          <li>
            Direct assignment submission checking and automatic plagiarism checking on upload.
          </li>
          <li>
            Similarity scores displayed inside Moodle, with student feedback visibility controls.
          </li>
          <li>LTI 1.3 and REST API for the Application Interface Client role.</li>
          <li>Administrator dashboards in addition to the detailed staff report.</li>
        </ul>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/login">Configure Moodle after sign-in</Link>
        </Button>
      </div>
      <div className="rounded-[24px] border border-line bg-[#f0ebe3] p-4 shadow-[var(--shadow-page)]">
        <div className="rounded-xl bg-[#8e3b2b] px-4 py-2 text-sm font-medium text-paper">
          Moodle · ECC110 Emergency Care Practice
        </div>
        <div className="mt-3 rounded-xl bg-surface-2 p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Assignment</p>
          <p className="font-medium">Primary survey skill reflection</p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line px-3 py-3">
            <span className="flex items-center gap-2 text-sm">
              <Upload className="size-4 text-teal" /> reflection.docx
            </span>
            <span className="rounded-full bg-teal px-2.5 py-1 text-xs font-medium text-teal-fg">
              Origina 41%
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">
            Automatic check on upload · Open full report in Origina
          </p>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">User roles</p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight">
          Administrator, academic staff, student, API.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Administrator", "System configuration, people, SLA, corpus, Moodle keys."],
            ["Academic staff", "Assignments, reports, academic judgement, student feedback."],
            ["Student", "Submit, see matches and sources, revisit past reports."],
            ["API client", "LTI / REST for Moodle and other institutional systems."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[22px] border border-line bg-paper p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
        Service, not a box
      </p>
      <h2 className="font-display mt-2 max-w-2xl text-3xl font-medium tracking-tight">
        Hosted, licensed, trained, and held to 99.9% availability.
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Lock, "POPIA", "WCG remains the owner of student information. Scripts stay private."],
          [
            Accessibility,
            "Access",
            "The workspace is built to be used by staff and students with disabilities.",
          ],
          [Shield, "AI ethics", "Authorship scores support judgement. They never replace it."],
          [
            ScanSearch,
            "Training",
            "Admin, staff and student programmes, with annual refreshers for three years.",
          ],
        ].map(([Icon, title, body]) => (
          <article key={String(title)} className="rounded-[22px] border border-line bg-surface p-5">
            <Icon className="size-5 text-teal" />
            <h3 className="mt-3 font-semibold">{title as string}</h3>
            <p className="mt-2 text-sm text-ink-soft">{body as string}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
