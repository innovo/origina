import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  Clock,
  EyeOff,
  Fingerprint,
  Headset,
  Languages,
  Lock,
  Plug,
  ScanSearch,
  Scale,
  Shield,
  ShieldCheck,
  Type,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { PublicFooter, PublicHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitDemoRequest } from "@/lib/origina/actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TRUST = [
  { icon: ShieldCheck, label: "POPIA-aware" },
  { icon: Headset, label: "South African support" },
  { icon: Plug, label: "Works with Moodle" },
  { icon: Building2, label: "Private workspace per institution" },
];

const PROBLEMS = [
  { icon: Bot, title: "AI writing is everywhere", text: "Essays can be generated in seconds." },
  {
    icon: EyeOff,
    title: "Copying hides in plain sight",
    text: "Invisible characters and lookalike letters fool basic checkers.",
  },
  { icon: Clock, title: "Manual checks take hours", text: "Time goes into searching, not teaching." },
];

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

const WHY = [
  { icon: Headset, title: "Local support", text: "A South African team and rand pricing." },
  { icon: Lock, title: "Your data stays yours", text: "Each institution works in its own private workspace." },
  { icon: Plug, title: "Fits how you work", text: "Connect Moodle or upload Word, PDF and PowerPoint." },
  { icon: Scale, title: "Staff decide", text: "Indicators, not verdicts. Every decision is recorded." },
];

type Plan = {
  name: string;
  audience: string;
  price: string;
  unit: string;
  cta: string;
  href: string;
  internal?: boolean;
  popular?: boolean;
  intro: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Pro",
    audience: "For lecturers, departments and colleges",
    price: "R89",
    unit: "per staff member per month",
    cta: "Start 14-day free trial",
    href: "/login",
    internal: true,
    popular: true,
    intro: "Includes:",
    features: [
      "Unlimited checks",
      "Copied, paraphrased and AI-written text",
      "Hidden characters and lookalike letters",
      "Word, PDF and PowerPoint uploads",
      "Your own source library",
      "Saved reports, decisions and audit trail",
      "Students join free",
    ],
  },
  {
    name: "Institution",
    audience: "For universities and multi-campus institutions",
    price: "Let's talk",
    unit: "Annual pricing, invoiced",
    cta: "Book a demo",
    href: "#demo",
    intro: "Everything in Pro, plus:",
    features: [
      "All campuses and departments",
      "Moodle and REST API",
      "Admin roles and onboarding",
      "Training for your staff",
      "Priority local support",
      "Pay by invoice or EFT",
    ],
  },
];

const FAQ = [
  {
    q: "Does Origina work with Moodle?",
    a: "Yes. Your administrator creates a key on the Moodle and API page and connects it.",
  },
  {
    q: "Is student data safe?",
    a: "Each institution has its own private workspace. Only your staff can see your submissions.",
  },
  {
    q: "Does Origina accuse students?",
    a: "No. It shows indicators. Staff review the report and make the final decision.",
  },
  { q: "What can we check?", a: "Pasted text, Word, PDF and PowerPoint files." },
  { q: "Can we try it first?", a: "Yes. Every new institution gets a 14-day free trial. No card needed." },
  {
    q: "How does billing work?",
    a: "Pro is billed monthly per staff member through PayFast. Students are free. Cancel any time.",
  },
];

const SECTION = "scroll-mt-20";

function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicHeader />
      <Hero />
      <TrustStrip />
      <Problems />
      <Features />
      <Why />
      <Pricing />
      <Faq />
      <Demo />
      <PublicFooter />
    </div>
  );
}

function SectionHeading({ title, text }: { title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-ink-soft">{text}</p>}
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
          Plagiarism, AI and hidden-text checks for schools, colleges and universities.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="#demo">
              Book a demo <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Sign in</Link>
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
          <span>Research essay</span>
          <span className="text-lime-ink">Similarity 38%</span>
        </div>
        <p className="paper-rule mt-5 text-[17px] leading-7 text-ink-soft">
          South Africa's energy future{" "}
          <mark className="mark-direct rounded-sm">
            depends on expanding renewable generation while keeping the grid stable
          </mark>{" "}
          during peak demand.{" "}
          <mark className="mark-semantic rounded-sm">
            Battery storage can smooth the gaps when wind and solar output drops
          </mark>
          .
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
          <div>
            <dt className="text-[14px] uppercase tracking-wider text-muted">Similarity</dt>
            <dd className="font-display text-xl text-ink">38%</dd>
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

function TrustStrip() {
  return (
    <section className="border-y border-line bg-surface">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
        {TRUST.map((t) => (
          <li key={t.label} className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
            <t.icon className="size-5 shrink-0 text-lime-ink" />
            {t.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Problems() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading title="Checking work is getting harder" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PROBLEMS.map((p) => (
          <article key={p.title} className="rounded-[22px] border border-line bg-surface p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-navy text-lime">
              <p.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
            <p className="mt-1 text-ink-soft">{p.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className={cn(SECTION, "border-y border-line bg-surface")}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading title="What Origina catches" />
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

function Why() {
  return (
    <section id="why" className={cn(SECTION, "bg-navy text-paper")}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Why Origina</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <article key={w.title}>
              <span className="grid size-11 place-items-center rounded-xl bg-lime text-navy">
                <w.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{w.title}</h3>
              <p className="mt-1 text-paper/75">{w.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className={cn(SECTION, "mx-auto max-w-6xl px-4 py-16 sm:px-6")}>
      <SectionHeading title="Pricing" text="Try everything free for 14 days. No card needed." />
      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        {PLANS.map((p) => (
          <article
            key={p.name}
            className={cn(
              "relative flex flex-col rounded-[22px] border bg-surface p-6",
              p.popular ? "border-lime-deep shadow-[var(--shadow-lift)] ring-2 ring-lime/40" : "border-line",
            )}
          >
            {p.popular && (
              <span className="absolute -top-3 left-6 rounded-full bg-lime px-3 py-0.5 text-sm font-semibold text-navy">
                Most popular
              </span>
            )}
            <h3 className="font-display text-2xl font-medium">{p.name}</h3>
            <p className="mt-1 text-ink-soft">{p.audience}</p>
            <p className="mt-6 font-display text-4xl font-medium tracking-tight">{p.price}</p>
            <p className="mt-1 min-h-10 text-sm text-muted">{p.unit}</p>
            <Button asChild size="lg" variant={p.popular ? "primary" : "outline"} className="mt-5 w-full">
              {p.internal ? (
                <Link to="/login" search={{ mode: "up" }}>
                  {p.cta}
                </Link>
              ) : (
                <a href={p.href}>{p.cta}</a>
              )}
            </Button>
            <p className="mt-6 text-sm font-semibold text-ink">{p.intro}</p>
            <ul className="mt-3 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-ink-soft">
                  <Check className="mt-0.5 size-5 shrink-0 text-lime-ink" />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className={cn(SECTION, "border-y border-line bg-surface")}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <SectionHeading title="Questions" />
        <div className="mt-8 divide-y divide-line rounded-[22px] border border-line bg-paper">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-xl text-lime-ink transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    role: "",
    phone: "",
    message: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitDemoRequest({ data: form });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="demo" className={cn(SECTION, "mx-auto max-w-6xl px-4 py-16 sm:px-6")}>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading title="Book a demo" text="See Origina on your own documents." />
          <ul className="mt-6 space-y-3">
            {["A short online walkthrough", "Pricing for your institution", "Help setting up Moodle"].map(
              (t) => (
                <li key={t} className="flex gap-2.5 text-ink-soft">
                  <Check className="mt-0.5 size-5 shrink-0 text-lime-ink" />
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="rounded-[22px] border border-line bg-surface p-6">
          {done ? (
            <div className="py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-lime text-navy">
                <Check className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">Thank you</h3>
              <p className="mt-1 text-ink-soft">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="d-name">Name</Label>
                <Input id="d-name" value={form.name} onChange={set("name")} required autoComplete="name" />
              </div>
              <div>
                <Label htmlFor="d-email">Work email</Label>
                <Input
                  id="d-email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="d-inst">Institution</Label>
                <Input
                  id="d-inst"
                  value={form.institution}
                  onChange={set("institution")}
                  required
                  autoComplete="organization"
                />
              </div>
              <div>
                <Label htmlFor="d-role">Role (optional)</Label>
                <Input id="d-role" value={form.role} onChange={set("role")} autoComplete="organization-title" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="d-phone">Phone (optional)</Label>
                <Input id="d-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="d-msg">Message (optional)</Label>
                <Textarea id="d-msg" className="min-h-28" value={form.message} onChange={set("message")} />
              </div>
              <div className="hidden" aria-hidden>
                <label htmlFor="d-web">Website</label>
                <input id="d-web" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
              </div>
              {error && <p className="text-sm text-risk sm:col-span-2">{error}</p>}
              <Button type="submit" size="lg" className="sm:col-span-2" disabled={busy}>
                {busy ? "Sending…" : "Request a demo"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
