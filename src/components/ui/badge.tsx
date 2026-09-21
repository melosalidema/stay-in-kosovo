import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.75rem] font-medium leading-5",
  {
    variants: {
      variant: {
        default: "bg-primary/[0.09] text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-transparent text-muted-foreground",
        glass: "border border-white/20 bg-black/25 text-white backdrop-blur-sm",
        rose: "bg-rose-500/[0.09] text-rose-800 dark:text-rose-300",
        amber: "bg-amber-500/[0.12] text-amber-900 dark:text-amber-300",
        green: "bg-emerald-600/[0.1] text-emerald-800 dark:text-emerald-300",
        blue: "bg-sky-600/[0.09] text-sky-800 dark:text-sky-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
