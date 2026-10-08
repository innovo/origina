import { cn } from "@/lib/utils";

/** Origina logo: ring with a lime tick, plus the "origina" wordmark. */
export function OriginaWordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <img
      src={light ? "/logo-inverse.svg" : "/logo.svg"}
      alt="Origina"
      width={335}
      height={116}
      className={cn("-my-1 -ml-1.5 h-12 w-auto shrink-0", className)}
    />
  );
}
