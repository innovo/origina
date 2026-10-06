import { useMemo, useState } from "react";
import { IDN_DEMOS, TRUSTED_HOSTS, inspectTextUrls, type IdnFinding } from "@/lib/origina/idn";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TONE = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  risk: "bg-risk-soft text-risk",
} as const;

function FindingCard({ f }: { f: IdnFinding }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm text-ink break-all">{f.unicodeHost}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium uppercase",
            TONE[f.severity],
          )}
        >
          {f.severity === "ok" ? "Clean" : f.severity === "warn" ? "Watch" : "Homograph"}
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Unicode host</dt>
          <dd className="font-mono text-ink-soft break-all">{f.unicodeHost}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Punycode (ACE)</dt>
          <dd className="font-mono text-ink-soft break-all">{f.punycodeHost}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Skeleton</dt>
          <dd className="font-mono text-ink-soft break-all">{f.skeleton}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Scripts</dt>
          <dd className="text-ink-soft">{f.scripts.join(" + ") || "-"}</dd>
        </div>
      </dl>
      {f.spoofOf && (
        <p className="mt-3 text-sm text-risk">
          Folds onto <span className="font-medium">{f.spoofOf}</span>, a watched academic or brand
          host.
        </p>
      )}
      {f.idna?.diverge && (
        <p className="mt-2 text-sm text-warn">
          IDNA2003 A-label {f.idna.idna2003.ascii ?? "rejected"} vs IDNA2008{" "}
          {f.idna.idna2008.ascii ?? "rejected"}.
        </p>
      )}
      <ul className="mt-3 space-y-1.5">
        {f.reasons.map((r) => (
          <li key={r} className="text-sm leading-relaxed text-ink-soft">
            {r}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function IdnExplorer() {
  const [text, setText] = useState(IDN_DEMOS[1].build());
  const [active, setActive] = useState(IDN_DEMOS[1].id);
  const result = useMemo(() => inspectTextUrls(text), [text]);
  const spoofs = result.findings.filter((f) => f.spoofOf).length;
  const puny = result.findings.filter((f) => f.hasPunycode).length;
  const mixed = result.findings.filter((f) => f.mixedScript).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="URLs found" value={result.findings.length} hint="Extracted from the passage" />
        <Stat label="Homographs" value={result.risk} hint="Mixed script or skeleton spoof" />
        <Stat label="Punycode labels" value={puny} hint="ACE xn-- on the wire" />
        <Stat label="Watched-brand hits" value={spoofs} hint="Folds onto a trusted host" />
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Method
          name="Mixed-script labels"
          count={mixed}
          body="Latin plus Cyrillic or Greek in one DNS label. Chrome and Edge show punycode for this."
        />
        <Method
          name="Skeleton vs register"
          count={spoofs}
          body="Fold confusables, then compare to WHO, PubMed, Cochrane, SANC, doi.org and known brands."
        />
        <Method
          name="Punycode / ACE"
          count={puny}
          body="xn-- encoding hides non-ASCII. Decode the label, then fold. The 2017 apple.com demo used this."
        />
        <Method
          name="Hidden marks in the host"
          count={result.findings.filter((f) => f.hiddenMarks).length}
          body="Zero-width space inside doi.org still looks like a DOI. Strip, then parse."
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {IDN_DEMOS.map((d) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-soft">Paste a passage with links</p>
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
            Works on https URLs and www hosts. Lookalikes that render as who.int or pubmed still
            fold onto the watched register.
          </p>
        </div>
        <div className="space-y-3">
          {result.findings.length === 0 ? (
            <p className="rounded-[22px] border border-line bg-surface p-5 text-sm text-muted">
              No URLs in this text. Paste a link or load a demo.
            </p>
          ) : (
            result.findings.map((f) => <FindingCard key={f.raw + f.unicodeHost} f={f} />)
          )}
        </div>
      </div>


      <article className="rounded-[22px] border border-line bg-surface p-5">
        <h2 className="font-semibold">Watched hosts</h2>
        <ul className="mt-4 columns-2 gap-x-6 text-sm text-ink-soft sm:columns-3">
          {TRUSTED_HOSTS.map((h) => (
            <li key={h} className="break-inside-avoid font-mono text-xs leading-6">
              {h}
            </li>
          ))}
        </ul>
      </article>
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

function Method({ name, count, body }: { name: string; count: number; body: string }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{name}</p>
      <p className="font-display mt-2 text-2xl tabular-nums text-ink">{count}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{body}</p>
    </article>
  );
}
