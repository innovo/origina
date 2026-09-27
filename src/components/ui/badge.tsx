import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const tones = {
  teal: "bg-teal-soft text-teal-deep",
  ink: "bg-paper-2 text-ink",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  risk: "bg-risk-soft text-risk",
  ai: "bg-ai-soft text-ai",
  muted: "bg-paper-2 text-muted",
};

export function Badge({
  className,
  tone = "ink",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
