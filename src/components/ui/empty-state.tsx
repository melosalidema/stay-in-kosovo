"use client";

import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="grid h-20 w-20 place-items-center rounded-2xl bg-muted/50"
      >
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </motion.div>
      <div className="space-y-2">
        <p className="text-lg font-bold">{title}</p>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden="true">
        <defs>
          <pattern id="empty-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#empty-dots)" />
      </svg>
    </motion.div>
  );
}
