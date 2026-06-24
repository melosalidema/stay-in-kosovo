"use client";

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
    <section className="section-band bg-muted/[0.3] !py-10">
      <div className="page-shell space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">{t("flow.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">{t("flow.title")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className="experience-card-home p-5 hover:-translate-y-0.5 hover:border-primary/[0.24]"
            >
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-primary/[0.1] text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold">{t(`flow.steps.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`flow.steps.${step.key}.text`)}
              </p>
            </div>
          ))}
          <div className="hidden" />
        </div>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/discover">{t("flow.getStarted")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
