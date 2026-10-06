import { AlertTriangle, BookOpen, Fingerprint, Languages, ScanSearch, Shield } from "lucide-react";
import { useState } from "react";
import { HighlightedDoc } from "@/components/highlighted-doc";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { Findings, MatchKind } from "@/lib/origina/types";
import { cn, formatDate } from "@/lib/utils";

const KIND_LABEL: Record<MatchKind, string> = {
  direct: "Direct match",
  partial: "Partial match",
  semantic: "Meaning-based",
  self: "Self-plagiarism",
};

const JUDGEMENT_LABEL: Record<string, string> = {
  clear: "No case",
  discuss: "Discuss with student",
  refer: "Refer to panel",
};

export function ReportView({
  title,
  filename,
  text,
  findings,
  createdAt,
  authorName,
  campusName,
  canJudge,
  onJudge,
  judgements = [],
  backTo,
}: {
  title: string;
  filename: string;
  text: string;
  findings: Findings;
  createdAt?: string;
  authorName?: string | null;
  campusName?: string | null;
  canJudge?: boolean;
  onJudge?: (decision: string, note: string) => Promise<void>;
  judgements?: { id: string; decision: string; note: string | null; createdAt: string; byName: string | null }[];
  backTo?: string;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <header>
        {backTo && (
          <a href={backTo} className="mb-3 inline-block text-sm text-muted hover:text-ink">
            ← Back
          </a>
        )}
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Similarity report
        </p>
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          {filename}
          {authorName ? ` · ${authorName}` : ""}
          {campusName ? ` · ${campusName}` : ""}
          {createdAt ? ` · ${formatDate(createdAt)}` : ""}
          {` · ${findings.wordCount} words · ${findings.language.name}`}
        </p>
      </header>

      <aside className="rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
        {findings.disclaimer}
      </aside>

      <section className="grid gap-4 rounded-[24px] border border-line bg-surface p-5 sm:grid-cols-3 sm:p-6">
        <ScoreRing value={findings.similarity} label="Similarity" hint="Matched sources" />
        <ScoreRing
          value={findings.ai.likelihood}
          label="AI indicator"
          hint={findings.ai.unavailable ? "Not available" : "Not proof on its own"}
        />
        <ScoreRing
          value={findings.obfuscation.score}
          label="Obfuscation"
          hint={
            findings.obfuscation.flags.length
              ? `${findings.obfuscation.flags.length} flags`
              : "No concealment found"
          }
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <HighlightedDoc text={text} spans={findings.spans} />

        <div className="space-y-6">
          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BookOpen className="size-4" /> Sources
            </h2>
            <ul className="mt-4 space-y-3">
              {findings.sources.length === 0 && (
                <li className="text-sm text-muted">No overlapping sources above threshold.</li>
              )}
              {findings.sources.map((s) => (
                <li key={s.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{s.title}</p>
                      <p className="text-xs text-muted">
                        {s.sourceRef} · {KIND_LABEL[s.kind]}
                      </p>
                    </div>
                    <span className="font-display tabular-nums text-lg text-lime-ink">
                      {s.overlapPct}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
              <span>Direct {findings.methods.direct}%</span>
              <span>Partial {findings.methods.partial}%</span>
              <span>Meaning {findings.methods.semantic}%</span>
              <span>Self {findings.methods.self}%</span>
            </div>
          </section>

          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Fingerprint className="size-4" /> Hidden tricks
            </h2>
            {findings.obfuscation.flags.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nothing hidden found.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {findings.obfuscation.flags.map((f) => (
                  <li key={f.kind} className="rounded-xl bg-risk-soft px-3 py-2 text-sm text-risk">
                    <span className="font-medium">{f.label}</span>
                    <span className="ml-2 tabular-nums">×{f.count}</span>
                    {f.samples[0] && (
                      <p className="mt-1 font-mono text-[14px] opacity-80">{f.samples[0]}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ScanSearch className="size-4" /> AI indicator
            </h2>
            {findings.ai.unavailable ? (
              <p className="mt-3 text-sm text-muted">
                Not available. Add an AI API key to turn this on.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-sm leading-relaxed text-ink-soft">{findings.ai.summary}</p>
                <ul className="space-y-1.5">
                  {findings.ai.indicators.map((ind) => (
                    <li key={ind} className="flex gap-2 text-sm text-ink">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-ai" />
                      {ind}
                    </li>
                  ))}
                </ul>
                {findings.ai.passages.map((p) => (
                  <blockquote
                    key={p.quote}
                    className="border-l-2 border-ai pl-3 text-sm text-ink-soft"
                  >
                    “{p.quote}”<footer className="mt-1 text-xs text-muted">{p.reason}</footer>
                  </blockquote>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[22px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Languages className="size-4" /> Citations
            </h2>
            {findings.citations.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No in-text citations parsed.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {findings.citations.map((c) => (
                  <li key={c.text} className="text-sm">
                    <span className="text-ink">{c.text}</span>
                    {c.issue && (
                      <p className="flex items-start gap-1 text-xs text-risk">
                        <AlertTriangle className="mt-0.5 size-3" /> {c.issue}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canJudge && onJudge && (
            <section className="rounded-[22px] border border-line bg-surface p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Shield className="size-4" /> Academic judgement
              </h2>
              <Textarea
                className="mt-3 min-h-24"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["clear", "No case"],
                  ["discuss", "Discuss with student"],
                  ["refer", "Refer to panel"],
                ].map(([id, label]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={id === "refer" ? "danger" : id === "clear" ? "outline" : "secondary"}
                    disabled={Boolean(busy)}
                    onClick={async () => {
                      setBusy(id);
                      try {
                        await onJudge(id, note);
                        setDone(label);
                        setNote("");
                      } catch (err) {
                        setDone(err instanceof Error ? `Not saved: ${err.message}` : "Not saved");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === id ? "Saving…" : label}
                  </Button>
                ))}
              </div>
              {done && <p className="mt-2 text-sm text-ok">Saved: {done}</p>}
              {judgements.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
                  {judgements.map((j) => (
                    <li key={j.id}>
                      <span className="font-medium">{JUDGEMENT_LABEL[j.decision] ?? j.decision}</span>
                      <span className="text-muted">
                        {" "}
                        · {j.byName ?? "Staff"} · {formatDate(j.createdAt)}
                      </span>
                      {j.note && <p className="text-ink-soft">{j.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>

      <p className={cn("text-xs text-muted")}>
        Green: copied or partial. Amber: meaning-based. Slate: self-plagiarism.
      </p>
    </div>
  );
}
