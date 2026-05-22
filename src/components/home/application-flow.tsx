"use client";

import { BrainCircuit, Building2, MapPinned, Route, Sparkles, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  { key: "location", icon: MapPinned },
  { key: "recommendations", icon: BrainCircuit },
  { key: "mobility", icon: Route },
  { key: "itinerary", icon: Sparkles },
  { key: "business", icon: Building2 },
  { key: "personalization", icon: UserRound }
];

export function ApplicationFlow() {
  const { t } = useTranslation();

  return (
    <section className="section-band bg-muted/30">
      <div className="page-shell space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">{t("flow.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">{t("flow.title")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.key} className="rounded-lg border border-border bg-card p-5">
              <step.icon className="mb-4 h-5 w-5 text-primary" />
              <h3 className="font-bold">{t(`flow.steps.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`flow.steps.${step.key}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
