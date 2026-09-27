import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/training")({ component: Training });

const MODULES = [
  {
    audience: "Students",
    title: "How to submit and read a report",
    body: "Upload or paste, wait for the four agents, then read highlighted matches and sources. The AI indicator is not a charge against you. Ask your lecturer if a match is a quotation you already cited.",
  },
  {
    audience: "Academic staff",
    title: "Judgement, not the percentage",
    body: "Open the report, separate similarity from authorship, look at obfuscation flags, then record clear / discuss / refer. Never treat a score as proof. Moodle shows the number; Origina holds the evidence.",
  },
  {
    audience: "Administrators",
    title: "Configuration, Moodle and SLA",
    body: "Issue API clients, map LTI, watch availability, and keep the corpus honest. Scheduled maintenance is announced in advance. Critical incidents: respond within 2 hours, resolve in 4–8.",
  },
  {
    audience: "All users",
    title: "Annual refresher 2027–2030",
    body: "At least one session a year for three years: correct use, common issues, and new features. Materials are online, in person at Stikland, and recorded.",
  },
];

function Training() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Three-year programme
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">Training</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Covers using the tool, doing submissions, understanding reports, and working with the
          Moodle integration — for administrators, academic staff and students.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => (
          <article key={m.title} className="rounded-[22px] border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-teal">{m.audience}</p>
            <h2 className="mt-2 font-semibold">{m.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
