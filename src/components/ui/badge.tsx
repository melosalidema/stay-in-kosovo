import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border border-border text-foreground",
      glass: "border border-white/20 bg-white/15 text-white backdrop-blur-xl",
      rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
      amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300"
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
