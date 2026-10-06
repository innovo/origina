import { cn } from "@/lib/utils";

/** Innovo Networks "i" mark: navy tile, lime ring, white stem. */
export function OriginaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1080 1080"
      className={cn("size-8", className)}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1080" height="1080" rx="240" className="fill-navy" />
      <g transform="translate(540 570) scale(1.35) translate(-540 -570)">
        <circle cx="540" cy="322" r="45" fill="none" strokeWidth="30" className="stroke-lime" />
        <rect x="498" y="422" width="84" height="396" rx="42" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function OriginaWordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OriginaMark className="size-8 shrink-0" />
      <span
        className={cn(
          "font-display text-[1.575rem] font-semibold leading-none tracking-tight",
          light ? "text-paper" : "text-ink",
        )}
      >
        Origina
      </span>
    </span>
  );
}
