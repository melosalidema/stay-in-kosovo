"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Compass, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "stay-kosovo-onboarding-completed";

type Step = {
  icon: typeof Compass;
  titleKey: string;
  textKey: string;
};

const steps: Step[] = [
  { icon: Compass, titleKey: "onboarding.step1Title", textKey: "onboarding.step1Text" },
  { icon: Sparkles, titleKey: "onboarding.step2Title", textKey: "onboarding.step2Text" },
  { icon: CalendarDays, titleKey: "onboarding.step3Title", textKey: "onboarding.step3Text" }
];

export function OnboardingTour() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    try {
      const completed = window.localStorage.getItem(STORAGE_KEY);
      if (!completed) setOpen(true);
    } catch {
      // localStorage may be unavailable — skip onboarding silently
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function next() {
    if (index < steps.length - 1) {
      setIndex((current) => current + 1);
    } else {
      dismiss();
    }
  }

  if (!open) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t("onboarding.title")}>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-glass"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("onboarding.label")} · {index + 1}/{steps.length}
          </span>
          <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t("onboarding.skip")}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold">{t(step.titleKey)}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(step.textKey)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((_, position) => (
              <motion.span
                key={position}
                layout
                className={cn("h-1.5 w-6 rounded-full transition-colors", position === index ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isLast && (
              <Button variant="ghost" size="sm" onClick={dismiss}>
                {t("onboarding.skip")}
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? t("onboarding.finish") : t("onboarding.next")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}