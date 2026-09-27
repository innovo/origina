import { cn } from "@/lib/utils";

export function OriginaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="7" className="fill-paper" />
      <rect x="3" y="13.5" width="26" height="5" className="fill-teal" />
      <path
        className="fill-ink"
        d="M16 5c-5 0-9 4.4-9 11s4 11 9 11 9-4.4 9-11-4-11-9-11zm0 4.2c2.7 0 4.8 2.9 4.8 6.8S18.7 22.8 16 22.8 11.2 19.9 11.2 16 13.3 9.2 16 9.2z"
      />
    </svg>
  );
}

export function OriginaWordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OriginaMark className="size-8 shrink-0" />
      <span className="leading-none">
        <span
          className={cn(
            "font-display block text-[1.35rem] font-medium tracking-tight",
            light ? "text-paper" : "text-ink",
          )}
        >
          Origina
        </span>
        <span
          className={cn(
            "block text-[10px] font-medium uppercase tracking-[0.18em]",
            light ? "text-paper/70" : "text-muted",
          )}
        >
          Integrity, verified
        </span>
      </span>
    </span>
  );
}
