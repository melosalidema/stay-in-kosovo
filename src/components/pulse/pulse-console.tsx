"use client";

import { Activity, AlertTriangle, Building2, Clock3, Compass, RadioTower, Route, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import type { DayPart, ExperiencePulseDTO } from "@/types";

const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica"];
const vibes = ["Chill", "Nightlife", "Romantic", "Adventure", "Local Food", "Hidden Gems", "Family Friendly"];
const dayParts: DayPart[] = ["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"];

type ApiPayload = {
  ok: true;
  data: ExperiencePulseDTO;
};

export function PulseConsole() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [city, setCity] = useState("Prishtina");
  const [vibe, setVibe] = useState("Hidden Gems");
  const [dayPart, setDayPart] = useState<DayPart>("EVENING");
  const [pulse, setPulse] = useState<ExperiencePulseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({ city, vibe, dayPart });
    return params.toString();
  }, [city, vibe, dayPart]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/pulse?${query}`)
      .then((response) => response.json())
      .then((payload: ApiPayload) => {
        if (!cancelled) setPulse(payload.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <section className="section-band">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="blue" className="mb-3">
              <RadioTower className="mr-1 h-3.5 w-3.5" />
              {t("pulseConsole.badge")}
            </Badge>
            <h1 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-4xl">
              {t("pulseConsole.title")}
            </h1>
          </div>
          <div className="grid gap-2 rounded-lg border border-border bg-card p-2 shadow-sm sm:grid-cols-3">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger aria-label={t("common.city")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vibe} onValueChange={setVibe}>
              <SelectTrigger aria-label={t("common.vibe")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vibes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {labels.vibe(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dayPart} onValueChange={(value) => setDayPart(value as DayPart)}>
              <SelectTrigger aria-label={t("common.hours")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayParts.map((item) => (
                  <SelectItem key={item} value={item}>
                    {labels.dayPart(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {(pulse?.insights ?? []).map((insight) => (
                <article key={insight.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">{insight.label}</p>
                  <p className="mt-2 text-3xl font-bold">{insight.value}</p>
                  <Badge variant={insight.tone} className="mt-3">
                    {insight.tone}
                  </Badge>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
                </article>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-slate-950 p-4 text-white shadow-glass">
              <div className="relative min-h-[500px] overflow-hidden rounded-md">
                <div className="map-grid absolute inset-0 bg-gradient-to-br from-slate-950 via-cyan-950 to-rose-950" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(45,212,191,0.24),transparent_30%),radial-gradient(circle_at_76%_64%,rgba(251,113,133,0.24),transparent_28%)]" />
                {(pulse?.zones ?? []).map((zone, index) => (
                  <div
                    key={zone.id}
                    className="absolute"
                    style={{
                      left: `${14 + ((index * 18) % 68)}%`,
                      top: `${18 + ((index * 16) % 58)}%`
                    }}
                  >
                    <span className="absolute -inset-3 animate-ping rounded-full bg-teal-300/30" />
                    <span className="relative grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/15 text-sm font-bold backdrop-blur-xl">
                      {zone.intensity}
                    </span>
                  </div>
                ))}
                <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-white/12 p-4 backdrop-blur-xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{t("pulseConsole.liveMap", { city: pulse?.city ?? city })}</p>
                      <p className="mt-1 text-sm text-white/70">{t("pulseConsole.mapText")}</p>
                    </div>
                    <Badge variant="glass">
                      <Activity className="mr-1 h-3.5 w-3.5" />
                      {loading ? t("common.loading") : labels.availability(pulse?.crowdMode ?? "")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(pulse?.zones ?? []).map((zone) => (
                <article key={zone.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{zone.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{labels.vibe(zone.primaryVibe)} · {zone.city}</p>
                    </div>
                    <Badge variant={zone.demandLevel === "surging" ? "rose" : zone.demandLevel === "high" ? "amber" : "green"}>
                      {labels.availability(zone.demandLevel)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{zone.summary}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-muted p-2">
                      <Compass className="mb-1 h-4 w-4 text-primary" />
                      {zone.intensity}/100
                    </span>
                    <span className="rounded-md bg-muted p-2">
                      <Route className="mb-1 h-4 w-4 text-primary" />
                      {labels.availability(zone.mobilityPressure)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("pulseConsole.topVibes")}
              </p>
              <div className="space-y-3">
                {(pulse?.topVibes ?? []).map((item) => (
                  <div key={item.vibe}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{labels.vibe(item.vibe)}</span>
                      <span className="font-semibold">{item.score}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <Building2 className="h-5 w-5 text-primary" />
                {t("pulseConsole.supplyGaps")}
              </p>
              <div className="space-y-3">
                {(pulse?.supplyGaps ?? []).map((gap) => (
                  <div key={gap.vibe} className="rounded-md bg-muted p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{labels.vibe(gap.vibe)}</span>
                      <span>{gap.supply} live</span>
                    </div>
                    <p className="mt-2 leading-6 text-muted-foreground">{gap.opportunity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-primary" />
                {t("pulseConsole.suggestedActions")}
              </p>
              <div className="space-y-2">
                {(pulse?.suggestedActions ?? []).map((action) => (
                  <p key={action} className="rounded-md bg-muted p-3 text-sm leading-6 text-muted-foreground">
                    {action}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-glass">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <Clock3 className="h-5 w-5 text-primary" />
                Methodology
              </p>
              <div className="space-y-2">
                {(pulse?.methodology ?? []).map((item) => (
                  <p key={item} className="text-sm leading-6 text-muted-foreground">{item}</p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
