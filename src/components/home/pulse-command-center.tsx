"use client";

import { Activity, ArrowUpRight, Bus, MapPinned, RadioTower, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { generateExperiencePulse } from "@/services/pulse-engine";

export function PulseCommandCenter() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const pulse = generateExperiencePulse({ city: "Prishtina", dayPart: "EVENING", vibe: "Nightlife" });

  return (
    <section className="section-band bg-background">
      <div className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="blue" className="mb-3">
                <RadioTower className="mr-1 h-3.5 w-3.5" />
                {t("pulseHome.badge")}
              </Badge>
              <h2 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-4xl">
                {t("pulseHome.title")}
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/pulse">
                {t("pulseHome.openConsole")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {pulse.insights.map((insight) => (
              <article key={insight.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <p className="mt-2 text-3xl font-bold">{insight.value}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {pulse.zones.slice(0, 4).map((zone) => (
              <article key={zone.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{zone.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{zone.city} · {labels.vibe(zone.primaryVibe)}</p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {zone.intensity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{zone.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={zone.demandLevel === "surging" ? "rose" : zone.demandLevel === "high" ? "amber" : "green"}>
                    {labels.availability(zone.demandLevel)}
                  </Badge>
                  <Badge variant="outline">{t("pulseHome.mobility", { value: labels.availability(zone.mobilityPressure) })}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-slate-950 p-5 text-white shadow-glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t("pulseHome.tonightIn", { city: pulse.city })}</p>
              <p className="mt-1 text-4xl font-black tracking-normal">{pulse.liveScore}</p>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-md bg-white/10">
              <Activity className="h-6 w-6 text-teal-200" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {pulse.topVibes.slice(0, 4).map((vibe) => (
              <div key={vibe.vibe} className="rounded-md bg-white/8 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{labels.vibe(vibe.vibe)}</span>
                  <span>{vibe.score}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-teal-300" style={{ width: `${vibe.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-white/8 p-3">
              <Bus className="mb-2 h-4 w-4 text-teal-200" />
              {t("pulseHome.transit", { value: pulse.transportHealth.averageReliability })}
            </div>
            <div className="rounded-md bg-white/8 p-3">
              <MapPinned className="mb-2 h-4 w-4 text-rose-200" />
              {t("pulseHome.mode", { value: labels.availability(pulse.crowdMode) })}
            </div>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-white/70">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
            {t("pulseHome.note")}
          </p>
        </aside>
      </div>
    </section>
  );
}
