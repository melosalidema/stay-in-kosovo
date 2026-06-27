"use client";

import { Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="section-band">
      <div className="page-shell flex min-h-[70vh] flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow"
        >
          <Compass className="h-8 w-8" />
        </motion.div>
        <div className="space-y-3 text-center">
          <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded-md bg-muted/60" />
        </div>
        <div className="grid w-full max-w-md gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted/40"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
