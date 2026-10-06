import { useMemo, useState } from "react";
import { analyseLocal } from "@/lib/origina/engine";
import {
  HOMOGLYPHS,
  HOMO_DEMOS,
  inspectHomoglyphs,
  poisonCyrillic,
  type GlyphScript,
  type HomoglyphHit,
} from "@/lib/origina/homoglyphs";
import { naiveWords } from "@/lib/origina/zero-width";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | GlyphScript; label: string }[] = [
  { id: "all", label: "All scripts" },
  { id: "cyrillic", label: "Cyrillic" },
  { id: "greek", label: "Greek" },
  { id: "fullwidth", label: "Fullwidth" },
  { id: "digit", label: "Digits" },
];

const SCRIPT_TONE: Record<GlyphScript, string> = {
  cyrillic: "bg-risk-soft text-risk",
  greek: "bg-ai-soft text-ai",
  fullwidth: "bg-warn-soft text-warn",
  compat: "bg-lime-soft text-navy",
  digit: "bg-ok-soft text-ok",
};

function VisualRun({ text, hits }: { text: string; hits: HomoglyphHit[] }) {
  const byIndex = useMemo(() => {
    const m = new Map<number, HomoglyphHit>();
    for (const h of hits) m.set(h.index, h);
    return m;
  }, [hits]);

  const nodes: { key: string; kind: "text" | "mark"; value: string; hit?: HomoglyphHit }[] = [];
  let buf = "";
  const flush = (i: number) => {
    if (buf) {
      nodes.push({ key: "t" + i, kind: "text", value: buf });
      buf = "";
    }
  };
  const limit = Math.min(text.length, 4000);
  for (let i = 0; i < limit; i++) {
    const hit = byIndex.get(i);
    if (hit) {
      flush(i);
      nodes.push({ key: "m" + i, kind: "mark", value: hit.from, hit });
    } else {
      buf += text[i];
    }
  }
  flush(limit);

  return (
    <div className="paper-rule max-h-[28rem] overflow-auto rounded-[22px] border border-line bg-surface-2 p-5 text-base leading-7 text-ink">
      {nodes.map((n) =>
        n.kind === "mark" && n.hit ? (
          <span
            key={n.key}
            title={`${n.hit.hex} ${n.hit.name} → ${n.hit.to}`}
            className={cn(
              "mx-0.5 inline-flex items-center gap-1 rounded-sm px-1 font-mono text-xs font-semibold leading-5",
              SCRIPT_TONE[n.hit.script],
            )}
          >
            {n.hit.from}
            <span className="opacity-70">→</span>
            {n.hit.to}
          </span>
        ) : (
          <span key={n.key}>{n.value}</span>
        ),
      )}
    </div>
  );
}

export function HomoglyphExplorer() {
  const [text, setText] = useState(HOMO_DEMOS[1].build());
  const [active, setActive] = useState(HOMO_DEMOS[1].id);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const inspected = useMemo(() => inspectHomoglyphs(text), [text]);
  const hits =
    filter === "all" ? inspected.hits : inspected.hits.filter((h) => h.script === filter);
  const naive = useMemo(() => naiveWords(text), [text]);
  const foldedWords = useMemo(() => naiveWords(inspected.folded), [inspected.folded]);
  const foldedFindings = useMemo(
    () => analyseLocal({ text: inspected.folded }),
    [inspected.folded],
  );
  const rawFindings = useMemo(
    () => analyseLocalRawish(text, inspected.folded),
    [text, inspected.folded],
  );

  const catalog = useMemo(() => {
    const core = HOMOGLYPHS.filter((m) => m.script !== "fullwidth");
    return core;
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Substitutions" value={inspected.hits.length} hint="Mapped to Latin" />
        <Stat
          label="Mixed-script words"
          value={inspected.mixedWords.length}
          hint="Latin plus another alphabet"
        />
        <Stat
          label="Naive unique tokens"
          value={new Set(naive.map((w) => w.toLowerCase())).size}
          hint={`${foldedWords.length} after folding`}
        />
        <Stat
          label="Similarity once folded"
          value={`${foldedFindings.similarity}%`}
          hint={foldedFindings.sources[0]?.title ?? "Against the source library"}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Method
          name="Skeleton folding"
          count={inspected.methods.skeleton}
          body="Hand map of Cyrillic and Greek lookalikes, tuned for academic scripts and IDN labels."
        />
        <Method
          name="UTS39 prose-safe"
          count={inspected.methods.tr39}
          body="unicode-confusables table, minus ASCII maps (m→rn). Catches math and rare lookalikes the hand map misses."
        />
        <Method
          name="NFKC / compatibility"
          count={inspected.methods.nfkc}
          body="Fullwidth and letterlike forms collapse to ASCII under compatibility normalisation."
        />
        <Method
          name="Digit-in-word"
          count={inspected.methods.digit}
          body="A 0 or 1 sitting inside a word is treated as o or l, not a measurement."
        />
        <Method
          name="Mixed-script words"
          count={inspected.methods.mixedWords}
          body="A word that mixes Latin with Cyrillic, Greek or fullwidth is flagged even before folding."
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {HOMO_DEMOS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setActive(d.id);
              setText(d.build());
            }}
            className={cn(
              "h-11 rounded-full px-3.5 text-sm",
              active === d.id ? "bg-ink text-paper" : "border border-line bg-surface text-ink-soft",
            )}
          >
            {d.label}
          </button>
        ))}
        <button
          type="button"
          className="h-11 rounded-full border border-line bg-surface px-3.5 text-sm text-ink-soft"
          onClick={() => {
            setActive("custom");
            setText((t) => poisonCyrillic(inspected.folded || t));
          }}
        >
          Poison current text
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-soft">Paste or edit</p>
          <Textarea
            value={text}
            onChange={(e) => {
              setActive("custom");
              setText(e.target.value);
            }}
            className="min-h-56 font-mono text-sm"
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-muted">
            Lookalikes render as the Latin letter in most fonts. The pane on the right names the
            code point and the fold Origina applies.
          </p>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-soft">Folded in place</p>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-8 rounded-full px-2.5 text-xs",
                    filter === f.id ? "bg-lime text-navy" : "bg-paper-2 text-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <VisualRun text={text} hits={hits} />
        </div>
      </div>

      {inspected.hits.length > 0 && (
        <aside className="rounded-2xl border border-risk/30 bg-risk-soft px-4 py-3 text-sm text-risk">
          “{rawFindings.sampleRaw}” is really “{rawFindings.sampleFolded}”. Similarity after
          folding: {foldedFindings.similarity}%.
        </aside>
      )}

      {inspected.mixedWords.length > 0 && (
        <section className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">Mixed-script words</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {inspected.mixedWords.slice(0, 16).map((w) => (
              <li
                key={w.start + w.word}
                className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-xs text-ink"
              >
                {w.word} <span className="text-muted">{w.scripts.join(" + ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-[22px] border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">From → to</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {inspected.groups.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No lookalike substitutions in this text.
                  </td>
                </tr>
              )}
              {inspected.groups.map((g) => (
                <tr key={g.hex + g.to} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 font-mono text-xs",
                        SCRIPT_TONE[g.script],
                      )}
                    >
                      {g.from} → {g.to}
                    </span>
                    <p className="mt-1 font-medium">{g.name}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{g.hex}</td>
                  <td className="px-4 py-3 tabular-nums">{g.count}</td>
                  <td className="px-4 py-3 text-ink-soft">{g.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <article className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">The catalogue Origina folds</h2>
          <ul className="mt-4 grid grid-cols-2 gap-1.5 text-xs">
            {catalog.map((m) => (
              <li key={m.code + m.from} className="flex items-center gap-2 font-mono text-ink-soft">
                <span className={cn("rounded-sm px-1 py-0.5 text-xs", SCRIPT_TONE[m.script])}>
                  {m.from}→{m.to}
                </span>
                {hex(m.code)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Plus U+FF21-U+FF3A and U+FF41-U+FF5A (fullwidth Latin), folded via NFKC.
          </p>
        </article>
      </section>
    </div>
  );
}

function hex(code: number) {
  return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}

function analyseLocalRawish(raw: string, folded: string) {
  const rawWords = naiveWords(raw);
  const foldedWords = naiveWords(folded);
  let sampleRaw = rawWords[0] ?? "";
  let sampleFolded = foldedWords[0] ?? "";
  for (let i = 0; i < Math.min(rawWords.length, foldedWords.length); i++) {
    if (rawWords[i] !== foldedWords[i]) {
      sampleRaw = rawWords[i];
      sampleFolded = foldedWords[i];
      break;
    }
  }
  return { sampleRaw, sampleFolded };
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-page)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  );
}

function Method({ name, count, body }: { name: string; count: number; body: string }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{name}</p>
      <p className="font-display mt-2 text-2xl tabular-nums text-ink">{count}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{body}</p>
    </article>
  );
}
