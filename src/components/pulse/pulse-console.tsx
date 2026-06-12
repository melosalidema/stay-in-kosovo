"use client";

import { AlertTriangle, Building2, Clock3, Compass, RadioTower, Route, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap } from "@/components/maps/google-places-map";
import { pulseIntensityTone, pulseZoneCardKeyframes, pulseZoneCardStyle } from "@/components/pulse/pulse-zone-card-effects";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places as allPlaces } from "@/data/kosovo-data";
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
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ city, vibe, dayPart });
    return params.toString();
  }, [city, vibe, dayPart]);

  const pulseMapPlaces = useMemo(() => {
    const zoneIds = new Set((pulse?.zones ?? []).map((zone) => zone.id));
    const activePlaces = zoneIds.size
      ? allPlaces.filter((place) => zoneIds.has(place.id))
      : allPlaces.filter((place) => place.city.toLowerCase() === city.toLowerCase());

    return activePlaces.length ? activePlaces : allPlaces;
  }, [city, pulse]);

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
      <style>{pulseZoneCardKeyframes}</style>
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
          <div className="experience-card-pulse grid gap-2 p-2 sm:grid-cols-3">
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
                <article key={insight.label} className="experience-card-pulse p-4">
                  <p className="text-sm text-muted-foreground">{insight.label}</p>
                  <p className="mt-2 text-3xl font-bold">{insight.value}</p>
                  <Badge variant={insight.tone} className="mt-3">
                    {insight.tone}
                  </Badge>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
                </article>
              ))}
            </div>

            <GooglePlacesMap
              places={pulseMapPlaces}
              title={t("pulseConsole.liveMap", { city: pulse?.city ?? city })}
              subtitle={loading ? t("common.loading") : `${t("pulseConsole.mapText")} · ${labels.availability(pulse?.crowdMode ?? "")}`}
              className="min-h-[540px]"
              variant="card"
              theme="auto"
              defaultZoom={city === "Prishtina" ? 11 : 9}
              fitPadding={64}
              animatedMarkers
            />

            <div className="grid gap-3 md:grid-cols-2">
              {(pulse?.zones ?? []).map((zone) => (
                <article
                  key={zone.id}
                  style={pulseZoneCardStyle(zone.intensity, hoveredZoneId === zone.id)}
                  className="experience-card-pulse group relative cursor-default overflow-hidden p-4 transition-[background,background-image,border-color,box-shadow,filter,transform] duration-200 ease-out will-change-transform"
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
                      <p className="mt-1 text-sm text-muted-foreground">{labels.vibe(zone.primaryVibe)} · {zone.city}</p>
                    </div>
                    <Badge variant={pulseIntensityTone(zone.intensity)}>
                      {labels.availability(zone.demandLevel)}
                    </Badge>
                  </div>
                  <p className="relative z-10 mt-3 text-sm leading-6 text-muted-foreground">{zone.summary}</p>
                  <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="relative overflow-hidden rounded-md bg-muted p-2 transition-colors group-hover:bg-primary/[0.1]">
                      <span
                        className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "rgb(var(--surge-rgb))" }}
                      />
                      <span
                        className="absolute right-1 top-1 h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: "rgb(var(--surge-rgb))",
                          opacity: "var(--surge-alpha)",
                          animation: "pulse-zone-dot var(--surge-duration) ease-in-out infinite"
                        }}
                      />
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
            <div className="experience-card-pulse p-5">
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

            <div className="experience-card-pulse p-5">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <Building2 className="h-5 w-5 text-primary" />
                {t("pulseConsole.supplyGaps")}
              </p>
              <div className="space-y-3">
                {(pulse?.supplyGaps ?? []).map((gap) => (
                  <div key={gap.vibe} className="rounded-md border border-border/[0.7] bg-muted/[0.7] p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{labels.vibe(gap.vibe)}</span>
                      <span>{gap.supply} live</span>
                    </div>
                    <p className="mt-2 leading-6 text-muted-foreground">{gap.opportunity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="experience-card-pulse p-5">
              <p className="mb-4 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-primary" />
                {t("pulseConsole.suggestedActions")}
              </p>
              <div className="space-y-2">
                {(pulse?.suggestedActions ?? []).map((action) => (
                  <p key={action} className="rounded-md border border-border/[0.7] bg-muted/[0.7] p-3 text-sm leading-6 text-muted-foreground">
                    {action}
                  </p>
                ))}
              </div>
            </div>

            <div className="experience-card-pulse p-5">
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
