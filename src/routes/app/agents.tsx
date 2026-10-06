import { createFileRoute, Link } from "@tanstack/react-router";
import { Fingerprint, Languages, ScanSearch, Type } from "lucide-react";

export const Route = createFileRoute("/app/agents")({ component: Agents });

const ITEMS = [
  {
    icon: ScanSearch,
    name: "Similarity",
    body: "Matches against your source library, earlier submissions and the student's own past work.",
  },
  {
    icon: Fingerprint,
    name: "Hidden tricks",
    body: "Finds invisible characters, lookalike letters and hidden text, then removes them before matching.",
  },
  {
    icon: Type,
    name: "AI indicator",
    body: "Estimates AI-written text. Shown separately from similarity and never proof on its own.",
  },
  {
    icon: Languages,
    name: "Citations",
    body: "Flags impossible years, placeholders, lookalike domains and invented references.",
  },
];

const LABS = [
  ["/app/zero-width", "Zero-width"],
  ["/app/homoglyphs", "Homoglyphs"],
  ["/app/idn", "IDN"],
  ["/app/idna", "IDNA"],
  ["/app/libraries", "Libraries"],
] as const;

function Agents() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Detection agents</h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {ITEMS.map((a) => (
          <article key={a.name} className="rounded-[22px] border border-line bg-surface p-5">
            <a.icon className="size-5 text-lime-ink" />
            <h2 className="mt-3 font-semibold">{a.name}</h2>
            <p className="mt-2 text-sm text-ink-soft">{a.body}</p>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {LABS.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-lime-deep"
          >
            {label} lab
          </Link>
        ))}
      </div>
    </div>
  );
}
