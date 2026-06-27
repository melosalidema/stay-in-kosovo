"use client";

import { AlertTriangle, Building2, Clock3, Compass, MapPin, RadioTower, RefreshCw, Route, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap, type MapSelectionSource } from "@/components/maps/google-places-map";
import { pulseIntensityTone, pulseZoneCardKeyframes, pulseZoneCardStyle } from "@/components/pulse/pulse-zone-card-effects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { places as allPlaces, vibes as experienceVibes } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { cn } from "@/lib/utils";
import type { DayPart, ExperiencePulseDTO } from "@/types";

const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica"];
const vibes = experienceVibes.map((vibe) => vibe.name);
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const zoneCardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const query = useMemo(() => {
    const params = new URLSearchParams({ city, vibe, dayPart });
    return params.toString();
  }, [city, vibe, dayPart]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  }, []);

  const pulseZoneIds = useMemo(() => new Set((pulse?.zones ?? []).map((zone) => zone.id)), [pulse]);

  const selectPulsePlace = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  const setZoneCardRef = useCallback((placeId: string, element: HTMLElement | null) => {
    if (element) {
      zoneCardRefs.current.set(placeId, element);
    } else {
      zoneCardRefs.current.delete(placeId);
    }
  }, []);

  const handleMapSelection = useCallback(
    (place: (typeof allPlaces)[number], source: MapSelectionSource) => {
      setSelectedPlaceId(place.id);

      if (source === "marker" && pulseZoneIds.has(place.id)) {
        window.setTimeout(() => {
          zoneCardRefs.current.get(place.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      }
    },
    [pulseZoneIds]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/pulse?${query}`)
      .then((response) => response.json())
      .then((payload: ApiPayload) => {
        if (!cancelled) setPulse(payload.data);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

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
            <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh} disabled={refreshing} aria-label={t("common.refresh")}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
              {t("common.refresh")}
            </Button>
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
              {loading && !pulse
                ? Array.from({ length: 3 }).map((_, index) => (
                    <article key={`insight-skeleton-${index}`} className="experience-card-pulse p-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-3 h-8 w-16" />
                      <Skeleton className="mt-3 h-5 w-14 rounded-full" />
                      <Skeleton className="mt-3 h-12 w-full" />
                    </article>
                  ))
                : (pulse?.insights ?? []).map((insight) => (
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
              places={allPlaces}
              title={t("pulseConsole.kosovoMap")}
              subtitle={loading ? t("common.loading") : `${t("pulseConsole.mapText")} · ${labels.availability(pulse?.crowdMode ?? "")}`}
              className="min-h-[540px]"
              variant="card"
              theme="auto"
              defaultZoom={8}
              fitPadding={64}
              focusZoom={14}
              animatedMarkers
              selectedPlaceId={selectedPlaceId}
              onSelectedPlaceChange={handleMapSelection}
            />

            <div className="grid gap-3 md:grid-cols-2">
              {loading && !pulse
                ? Array.from({ length: 4 }).map((_, index) => (
                    <article key={`zone-skeleton-${index}`} className="experience-card-pulse p-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-2 h-4 w-28" />
                      <Skeleton className="mt-4 h-16 w-full" />
                    </article>
                  ))
                : (pulse?.zones ?? []).map((zone) => (
                <article
                  key={zone.id}
                  ref={(element) => setZoneCardRef(zone.id, element)}
                  style={pulseZoneCardStyle(zone.intensity, hoveredZoneId === zone.id || selectedPlaceId === zone.id)}
                  className={cn(
                    "experience-card-pulse group relative cursor-pointer overflow-hidden p-4 transition-[background,background-image,border-color,box-shadow,filter,transform] duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55",
                    selectedPlaceId === zone.id && "ring-2 ring-primary/45"
                  )}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onFocus={() => setHoveredZoneId(zone.id)}
                  onBlur={() => setHoveredZoneId(null)}
                  onClick={() => selectPulsePlace(zone.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    selectPulsePlace(zone.id);
                  }}
                  role="button"
                  aria-pressed={selectedPlaceId === zone.id}
                  aria-label={`${zone.title} map focus`}
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
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant={pulseIntensityTone(zone.intensity)}>
                        {labels.availability(zone.demandLevel)}
                      </Badge>
                      {selectedPlaceId === zone.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.14] px-2 py-1 text-[11px] font-semibold text-primary">
                          <MapPin className="h-3 w-3" />
                          {t("pulseConsole.mapFocus")}
                        </span>
                      )}
                    </div>
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
