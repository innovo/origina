import { cn, scoreTone } from "@/lib/utils";

export function ScoreRing({
  value,
  label,
  hint,
  size = 112,
}: {
  value: number | null;
  label: string;
  hint?: string;
  size?: number;
}) {
  const tone = scoreTone(value);
  const stroke =
    tone === "ok"
      ? "var(--color-ok)"
      : tone === "warn"
        ? "var(--color-warn)"
        : tone === "risk"
          ? "var(--color-risk)"
          : "var(--color-line-strong)";
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-paper-2)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-2xl tabular-nums text-ink">
            {value == null ? "-" : `${Math.round(value)}`}
            {value != null && <span className="text-sm text-muted">%</span>}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className={cn("text-xs text-muted")}>{hint}</p>}
      </div>
    </div>
  );
}
