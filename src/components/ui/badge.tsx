import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "bg-primary/[0.1] text-primary",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border border-border bg-background/[0.45] text-foreground",
      glass: "border border-white/20 bg-white/[0.15] text-white backdrop-blur-xl",
      rose: "bg-rose-500/[0.09] text-rose-700 dark:text-rose-300",
      amber: "bg-amber-500/[0.1] text-amber-800 dark:text-amber-300",
      green: "bg-emerald-500/[0.1] text-emerald-800 dark:text-emerald-300",
      blue: "bg-sky-500/[0.1] text-sky-800 dark:text-sky-300"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
