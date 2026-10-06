import { useMemo, useState } from "react";
import {
  DEVIATION_CHARS,
  IDNA_DEMOS,
  hostFromText,
  processIdna,
} from "@/lib/origina/idna";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IdnaExplorer() {
  const [text, setText] = useState(IDNA_DEMOS[1].build());
  const [active, setActive] = useState(IDNA_DEMOS[1].id);
  const host = useMemo(() => hostFromText(text), [text]);
  const report = useMemo(() => processIdna(host), [host]);

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat
          label="IDNA2008 A-label"
          value={report.idna2008.ascii ?? "rejected"}
          hint={report.idna2008.error ? "Failed RFC 5891 checks" : "Nontransitional UTS #46"}
        />
        <Stat
          label="IDNA2003 A-label"
          value={report.idna2003.ascii ?? "rejected"}
          hint={report.idna2003.error ? "Failed transitional processing" : "Transitional mapping"}
        />
        <Stat
          label="Profiles diverge"
          value={report.diverge ? "Yes" : "No"}
          hint="Different A-labels = different DNS names"
        />
        <Stat label="Deviation chars" value={report.deviations.length} hint="ß  ς  ZWJ  ZWNJ" />
      </section>


      <div className="flex flex-wrap gap-2">
        {IDNA_DEMOS.map((d) => (
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
          <p className="mb-2 text-sm font-medium text-ink-soft">Host or URL</p>
          <Textarea
            value={text}
            onChange={(e) => {
              setActive("custom");
              setText(e.target.value);
            }}
            className="min-h-36 font-mono text-sm"
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-muted">
            Parsed host: <span className="font-mono text-ink">{host || "-"}</span>
          </p>
        </div>
        <article className="rounded-[22px] border border-line bg-surface p-5">
          <h2 className="font-semibold">Processing result</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="U-label (2008)" v={report.idna2008.unicode || "-"} />
            <Row k="A-label (2008)" v={report.idna2008.ascii ?? "rejected"} />
            <Row k="A-label (2003)" v={report.idna2003.ascii ?? "rejected"} />
            <Row
              k="Status"
              v={
                report.idna2008.error
                  ? "IDNA2008 invalid"
                  : report.diverge
                    ? "Valid, profiles disagree"
                    : "Valid under both"
              }
            />
          </dl>
          <ul className="mt-4 space-y-2">
            {report.issues.map((issue) => (
              <li key={issue} className="text-sm leading-relaxed text-ink-soft">
                {issue}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {report.diverge && (
        <aside className="rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          https://{host} resolves to a different domain under IDNA2003 and IDNA2008.
        </aside>
      )}
      {!report.idna2008.ascii && report.idna2003.ascii && (
        <aside className="rounded-2xl border border-risk/30 bg-risk-soft px-4 py-3 text-sm text-risk">
          IDNA2008 rejects this host. IDNA2003 would accept it as {report.idna2003.ascii}.
        </aside>
      )}

      <section className="overflow-x-auto rounded-[22px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Deviation</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">IDNA2003</th>
              <th className="px-4 py-3 font-medium">Why it still matters</th>
            </tr>
          </thead>
          <tbody>
            {DEVIATION_CHARS.map((d) => (
              <tr key={d.hex} className="border-b border-line last:border-0 align-top">
                <td className="px-4 py-3 font-medium">
                  {d.char === "\u200C" || d.char === "\u200D" ? d.name : `${d.char}  ${d.name}`}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{d.hex}</td>
                <td className="px-4 py-3 font-mono text-xs">→ {d.mappedTo}</td>
                <td className="px-4 py-3 text-ink-soft">{d.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 shrink-0 text-xs uppercase tracking-wider text-muted">{k}</dt>
      <dd className="font-mono text-ink break-all">{v}</dd>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article className="rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-page)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="font-display mt-2 text-2xl leading-tight text-ink break-all">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </article>
  );
}
