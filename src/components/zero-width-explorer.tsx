import { useMemo, useState } from "react";
import { analyseLocal } from "@/lib/origina/engine";
import {
  INVISIBLES,
  POISON_DEMOS,
  inspectInvisible,
  naiveWords,
  poisonLetters,
  type InvisibleCategory,
  type InvisibleHit,
} from "@/lib/origina/zero-width";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | InvisibleCategory; label: string }[] = [
  { id: "all", label: "All marks" },
  { id: "zero-width", label: "Zero-width" },
  { id: "bidi", label: "Bidi" },
  { id: "format", label: "Format" },
  { id: "filler", label: "Fillers" },
];

const CAT_TONE: Record<InvisibleCategory, string> = {
  "zero-width": "bg-risk-soft text-risk",
  bidi: "bg-ai-soft text-ai",
  format: "bg-warn-soft text-warn",
  filler: "bg-lime-soft text-navy",
};

function VisualRun({ text, hits }: { text: string; hits: InvisibleHit[] }) {
  const byIndex = useMemo(() => {
    const m = new Map<number, InvisibleHit>();
    for (const h of hits) m.set(h.index, h);
    return m;
  }, [hits]);

  const nodes: { key: string; kind: "text" | "mark"; value: string; hit?: InvisibleHit }[] = [];
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
      nodes.push({ key: "m" + i, kind: "mark", value: hit.short, hit });
    } else {
      buf += text[i];
    }
  }
  flush(limit);
  const clipped = text.length > limit;

  return (
    <div className="paper-rule max-h-[28rem] overflow-auto rounded-[22px] border border-line bg-surface-2 p-5 text-[17px] leading-7 text-ink">
      {nodes.map((n) =>
        n.kind === "mark" && n.hit ? (
          <span
            key={n.key}
            title={`${n.hit.hex} ${n.hit.name} · index ${n.hit.index}`}
            className={cn(
              "mx-0.5 inline-flex translate-y-[-1px] items-center rounded-sm px-1 font-mono text-[14px] font-semibold uppercase leading-5 tracking-wide",
              CAT_TONE[n.hit.category],
            )}
          >
            {n.value}
          </span>
        ) : (
          <span key={n.key}>{n.value}</span>
        ),
      )}
      {clipped && <p className="mt-3 text-xs text-muted">Showing the first 4,000 characters.</p>}
    </div>
  );
}

export function ZeroWidthExplorer() {
  const [text, setText] = useState(POISON_DEMOS[2].build());
  const [active, setActive] = useState(POISON_DEMOS[2].id);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const inspected = useMemo(() => inspectInvisible(text), [text]);
  const hits =
    filter === "all" ? inspected.hits : inspected.hits.filter((h) => h.category === filter);
  const naive = useMemo(() => naiveWords(text), [text]);
  const cleanedWords = useMemo(() => naiveWords(inspected.cleaned), [inspected.cleaned]);
  const naiveFindings = useMemo(
    () => analyseLocal({ text: inspected.cleaned }),
    [inspected.cleaned],
  );
  const broken = naive.length !== cleanedWords.length;

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Invisible marks" value={inspected.hits.length} hint="All categories" />
        <Stat
          label="Visible length"
          value={`${inspected.visibleLength}/${inspected.rawLength}`}
          hint="After stripping"
        />
        <Stat
          label="Naive tokens"
          value={naive.length}
          hint={broken ? "Words split by hidden marks" : "Same as cleaned"}
        />
        <Stat
          label="Similarity once stripped"
          value={`${naiveFindings.similarity}%`}
          hint={naiveFindings.sources[0]?.title ?? "Against the source library"}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {POISON_DEMOS.map((d) => (
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
            setText((t) => poisonLetters(inspected.cleaned || t));
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
            className="min-h-56 font-mono text-[15px]"
            spellCheck={false}
          />
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-soft">What Origina actually sees</p>
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

      {broken && (
        <aside className="rounded-2xl border border-risk/30 bg-risk-soft px-4 py-3 text-sm text-risk">
          Hidden marks split {cleanedWords.length} words into {naive.length} fragments. Origina
          removes them first.
        </aside>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-[22px] border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">Mark</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {inspected.groups.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No invisible characters in this text.
                  </td>
                </tr>
              )}
              {inspected.groups.map((g) => (
                <tr key={g.code} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 font-mono text-[14px]",
                        CAT_TONE[g.category],
                      )}
                    >
                      {g.short}
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
          <h2 className="font-semibold">The catalogue Origina watches</h2>
          <ul className="mt-4 grid grid-cols-2 gap-1.5 text-xs">
            {INVISIBLES.map((m) => (
              <li key={m.code} className="flex items-center gap-2 font-mono text-ink-soft">
                <span className={cn("rounded-sm px-1 py-0.5 text-[14px]", CAT_TONE[m.category])}>
                  {m.short}
                </span>
                U+{m.code.toString(16).toUpperCase().padStart(4, "0")}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {hits.length > 0 && hits.length <= 40 && (
        <section className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">Positions</h2>
          <ol className="mt-3 space-y-2 font-mono text-xs text-ink-soft">
            {hits.slice(0, 24).map((h) => (
              <li key={h.index}>
                <span className="text-muted">{h.index.toString().padStart(4, "0")}</span>{" "}
                <span className="text-ink">{h.hex}</span> {h.short} · “{h.before}
                <span className="text-risk">▮</span>
                {h.after}”
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
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
