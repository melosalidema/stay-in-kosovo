"use client";

import { cn } from "@/lib/utils";

export function Tooltip({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative ml-1 inline-flex cursor-help", className)}>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium text-muted-foreground">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100">
        {text}
      </span>
    </span>
  );
}
