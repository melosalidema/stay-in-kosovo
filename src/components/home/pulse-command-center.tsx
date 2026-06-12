"use client";

import { Activity, ArrowUpRight, Bus, MapPinned, RadioTower, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experienceCardKeyframes, homePulseCardStyle, pulseIntensityTone } from "@/components/ui/experience-card-effects";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { generateExperiencePulse } from "@/services/pulse-engine";

export function PulseCommandCenter() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const pulse = generateExperiencePulse({ city: "Prishtina", dayPart: "EVENING", vibe: "Nightlife" });
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  return (
    <section className="section-band bg-background">
      <style>{experienceCardKeyframes}</style>
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
              <article key={insight.label} className="experience-card-home p-4">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <p className="mt-2 text-3xl font-bold">{insight.value}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {pulse.zones.slice(0, 4).map((zone) => (
              <article
                key={zone.id}
                style={homePulseCardStyle(zone.intensity, hoveredZoneId === zone.id)}
                className="experience-card-home group relative cursor-default overflow-hidden p-4"
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                onFocus={() => setHoveredZoneId(zone.id)}
                onBlur={() => setHoveredZoneId(null)}
                tabIndex={0}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                <span
                  className="pointer-events-none absolute inset-0 z-0 rounded-lg"
                  style={{
                    background:
                      "radial-gradient(circle at 88% 10%, rgb(var(--surge-rgb) / var(--surge-alpha)), transparent 34%)",
                    boxShadow: "inset 0 0 0 1px rgb(var(--surge-rgb) / calc(var(--surge-alpha) * 1.4))",
                    animation: "pulse-card-halo var(--surge-duration) ease-in-out infinite"
                  }}
                />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{zone.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{zone.city} · {labels.vibe(zone.primaryVibe)}</p>
                  </div>
                  <span
                    className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md text-sm font-bold"
                    style={{
                      backgroundColor: "rgb(var(--surge-rgb) / 0.14)",
                      boxShadow: "inset 0 0 0 1px rgb(var(--surge-rgb) / 0.28)",
                      color: "rgb(var(--surge-rgb))"
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-1 rounded-md"
                      style={{
                        backgroundColor: "rgb(var(--surge-rgb))",
                        opacity: "calc(var(--surge-alpha) * 0.55)",
                        animation: "pulse-zone-dot var(--surge-duration) ease-in-out infinite"
                      }}
                    />
                    <span className="relative z-10">{zone.intensity}</span>
                  </span>
                </div>
                <p className="relative z-10 mt-3 text-sm leading-6 text-muted-foreground">{zone.summary}</p>
                <div className="relative z-10 mt-3 flex flex-wrap gap-2">
                  <Badge variant={pulseIntensityTone(zone.intensity)}>
                    {labels.availability(zone.demandLevel)}
                  </Badge>
                  <Badge variant="outline">{t("pulseHome.mobility", { value: labels.availability(zone.mobilityPressure) })}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit overflow-hidden rounded-lg border border-white/[0.12] bg-slate-950 p-5 text-white shadow-pulse">
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
              <div key={vibe.vibe} className="rounded-md border border-white/10 bg-white/[0.08] p-3">
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
            <div className="rounded-md border border-white/10 bg-white/[0.08] p-3">
              <Bus className="mb-2 h-4 w-4 text-teal-200" />
              {t("pulseHome.transit", { value: pulse.transportHealth.averageReliability })}
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.08] p-3">
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
