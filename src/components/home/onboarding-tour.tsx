"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Compass, MapPin, X } from "lucide-react";
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
  { icon: MapPin, titleKey: "onboarding.step2Title", textKey: "onboarding.step2Text" },
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.title")}
    >
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-overlay sm:rounded-2xl sm:shadow-lift"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
            <step.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t("onboarding.skip")}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            <h2 className="font-serif text-2xl">{t(step.titleKey)}</h2>
            <p className="mt-2.5 text-sm leading-6 text-muted-foreground">{t(step.textKey)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((_, position) => (
              <span
                key={position}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  position === index ? "w-5 bg-primary" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
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
