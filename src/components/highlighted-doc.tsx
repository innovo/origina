import { useMemo } from "react";
import type { MatchKind, TextSpan } from "@/lib/origina/types";
import { cn } from "@/lib/utils";

const KIND_CLASS: Record<MatchKind, string> = {
  direct: "mark-direct",
  partial: "mark-partial",
  semantic: "mark-semantic",
  self: "mark-self",
};

export function HighlightedDoc({
  text,
  spans,
  className,
}: {
  text: string;
  spans: TextSpan[];
  className?: string;
}) {
  const parts = useMemo(() => {
    const sorted = [...spans]
      .filter((s) => s.end > s.start && s.start >= 0 && s.end <= text.length)
      .sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number; kind: MatchKind; sourceId: string }[] = [];
    for (const s of sorted) {
      const last = merged[merged.length - 1];
      if (last && s.start < last.end) {
        last.end = Math.max(last.end, s.end);
        continue;
      }
      merged.push({ ...s });
    }
    const nodes: { key: string; text: string; span?: (typeof merged)[number] }[] = [];
    let cursor = 0;
    merged.forEach((s, i) => {
      if (s.start > cursor) {
        nodes.push({ key: `t-${cursor}`, text: text.slice(cursor, s.start) });
      }
      nodes.push({
        key: `s-${i}`,
        text: text.slice(s.start, s.end),
        span: s,
      });
      cursor = s.end;
    });
    if (cursor < text.length) nodes.push({ key: `t-end`, text: text.slice(cursor) });
    return nodes;
  }, [text, spans]);

  return (
    <div
      className={cn(
        "paper-rule rounded-[22px] border border-line bg-surface-2 p-6 text-[15px] leading-7 text-ink shadow-[var(--shadow-page)] sm:p-8",
        className,
      )}
    >
      {parts.map((p) =>
        p.span ? (
          <mark
            key={p.key}
            className={cn("rounded-[2px] px-0.5", KIND_CLASS[p.span.kind])}
            title={p.span.sourceId}
          >
            {p.text}
          </mark>
        ) : (
          <span key={p.key}>{p.text}</span>
        ),
      )}
    </div>
  );
}
