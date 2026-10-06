import { useMemo, useState } from "react";
import { LIBRARY_DEMOS, compareFolds } from "@/lib/origina/libraries";
import { librarySurvey } from "@/lib/origina/tr39";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LibraryFold } from "@/lib/origina/tr39";

function FoldCard({ fold, original }: { fold: LibraryFold; original: string }) {
  const changed = fold.folded !== original;
  return (
    <article className="rounded-[22px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-ink">{fold.name}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            changed ? "bg-risk-soft text-risk" : "bg-ok-soft text-ok",
          )}
        >
          {fold.hitCount} fold{fold.hitCount === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm leading-relaxed text-ink break-all">{fold.folded}</p>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">{fold.note}</p>
    </article>
  );
}

export function LibrariesExplorer() {
  const [text, setText] = useState(LIBRARY_DEMOS[0].build());
  const [active, setActive] = useState(LIBRARY_DEMOS[0].id);
  const folds = useMemo(() => compareFolds(text), [text]);
  const origina = folds[0];
  const raw = folds.find((f) => f.id === "tr39-raw")!;
  const asciiTraps = raw.hits.filter(
    (h) => h.point !== h.similarTo && /^[A-Za-z0-9]$/.test(h.point),
  ).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Origina folds" value={origina.hitCount} hint="What reports actually use" />
        <Stat label="UTS39 raw folds" value={raw.hitCount} hint="unicode-confusables, unfiltered" />
        <Stat label="ASCII traps" value={asciiTraps} hint="m→rn, I→l, 0→O, 1→l" />
        <Stat
          label="Libraries surveyed"
          value={librarySurvey().length}
          hint="JS, Rust, ICU, Python"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {LIBRARY_DEMOS.map((d) => (
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
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-soft">Same sentence, four folders</p>
        <Textarea
          value={text}
          onChange={(e) => {
            setActive("custom");
            setText(e.target.value);
          }}
          className="min-h-36 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {asciiTraps > 0 && origina.hitCount === 0 && (
        <aside className="rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          Raw UTS39 changes normal English (m → rn). Origina leaves it alone.
        </aside>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {folds.map((f) => (
          <FoldCard key={f.id} fold={f} original={text} />
        ))}
      </div>

      <section className="overflow-x-auto rounded-[22px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Library</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Use it for</th>
              <th className="px-4 py-3 font-medium">Do not use it for</th>
              <th className="px-4 py-3 font-medium">In Origina</th>
            </tr>
          </thead>
          <tbody>
            {librarySurvey().map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{row.name}</p>
                  <p className="font-mono text-xs text-muted">{row.weekly}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {row.data}
                  <p className="text-xs text-muted">{row.size}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{row.use}</td>
                <td className="px-4 py-3 text-ink-soft">{row.skip}</td>
                <td className="px-4 py-3">
                  {row.wired ? (
                    <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-medium text-ok">
                      Wired
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Surveyed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
