import { createFileRoute, Link } from "@tanstack/react-router";
import { Fingerprint, Languages, ScanSearch, Type } from "lucide-react";

export const Route = createFileRoute("/app/agents")({ component: Agents });

const ITEMS = [
  {
    icon: ScanSearch,
    name: "Similarity agent",
    method: "Direct, partial and meaning-based matching",
    body: "Compares the script with previously submitted work, the institutional repository, online sources and named external databases. Covers self-plagiarism and text that has been translated or reworked to hide a source.",
  },
  {
    icon: Fingerprint,
    name: "Obfuscation agent",
    method: "Deterministic character forensics",
    body: "Zero-width characters, homoglyph and character substitution, hidden text and font manipulation, bidi overrides, control characters, hidden metadata and non-printing marks. The cleaned text is what similarity actually reads.",
  },
  {
    icon: Type,
    name: "Authorship agent",
    method: "AI-generated or AI-assisted writing",
    body: "Screens for generated, paraphrased or reworked text. The indicator is reported separately from similarity so the two are never conflated, and it is a decision-support aid — not proof of misconduct.",
  },
  {
    icon: Languages,
    name: "Citation agent",
    method: "References that cannot be right",
    body: "Parses in-text citations, flags impossible years, placeholders, lookalike domains (IDN homographs) and, when the authorship model is available, references that appear fabricated.",
  },
];

function Agents() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Detection methodology
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">
          Four agents, one report
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Each submission is analysed with a combination of methods so copied, similar and concealed
          content can be shown clearly. Academic staff still decide.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {ITEMS.map((a) => (
          <article key={a.name} className="rounded-[22px] border border-line bg-surface p-5">
            <a.icon className="size-5 text-teal" />
            <h2 className="mt-3 font-semibold">{a.name}</h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">{a.method}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a.body}</p>
            {a.name === "Obfuscation agent" && (
              <div className="mt-4 flex flex-wrap gap-4">
                <Link to="/zero-width" className="text-sm font-medium text-teal">
                  Zero-width lab →
                </Link>
                <Link to="/homoglyphs" className="text-sm font-medium text-teal">
                  Homoglyph lab →
                </Link>
                <Link to="/idn" className="text-sm font-medium text-teal">
                  IDN lab →
                </Link>
                <Link to="/idna" className="text-sm font-medium text-teal">
                  IDNA 2008 →
                </Link>
                <Link to="/libraries" className="text-sm font-medium text-teal">
                  Library survey →
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
