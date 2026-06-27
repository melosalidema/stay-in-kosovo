"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

const steps = [
  { key: "vibe", icon: Sparkles },
  { key: "ai", icon: BrainCircuit },
  { key: "explore", icon: Compass }
];

export function ApplicationFlow() {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="section-band bg-muted/[0.3] !py-10"
    >
      <div className="page-shell space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">{t("flow.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">{t("flow.title")}</h2>
        </div>
        <div className="relative grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.12 }}
              className="experience-card-home relative p-5 hover:-translate-y-0.5 hover:border-primary/[0.24]"
            >
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.12 + 0.2, ease: "easeOut" }}
                  className="absolute -right-4 top-1/2 hidden h-p w-8 origin-left border-t border-dashed border-primary/30 md:block"
                  style={{ transformOrigin: "left center" }}
                />
              )}
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-primary/[0.1] text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold">{t(`flow.steps.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`flow.steps.${step.key}.text`)}
              </p>
            </motion.div>
          ))}
          <div className="hidden" />
        </div>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/discover">{t("flow.getStarted")}</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
