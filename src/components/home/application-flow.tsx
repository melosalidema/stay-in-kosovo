"use client";

import { Bookmark, Compass, MapPin } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  { key: "mood", icon: Compass },
  { key: "explore", icon: MapPin },
  { key: "keep", icon: Bookmark }
];

export function ApplicationFlow() {
  const { t } = useTranslation();

  return (
    <section className="section-band section-plain bg-secondary/30">
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("flow.eyebrow")}
          title={t("flow.title")}
          description={t("flow.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/discover">{t("flow.getStarted")}</Link>
            </Button>
          }
        />

        <ol className="mt-9 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.key} className="bg-card p-6">
              <div className="flex items-center gap-3">
                <step.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl">{t(`flow.steps.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`flow.steps.${step.key}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
