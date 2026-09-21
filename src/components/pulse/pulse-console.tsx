"use client";

import { MapPin, RefreshCw, Route } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap, type MapSelectionSource } from "@/components/maps/google-places-map";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const zoneCardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const query = useMemo(() => new URLSearchParams({ city, vibe, dayPart }).toString(), [city, vibe, dayPart]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
  }, []);

  const pulseZoneIds = useMemo(() => new Set((pulse?.zones ?? []).map((zone) => zone.id)), [pulse]);

  const setZoneCardRef = useCallback((placeId: string, element: HTMLElement | null) => {
    if (element) zoneCardRefs.current.set(placeId, element);
    else zoneCardRefs.current.delete(placeId);
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

  const crowdMode = pulse?.crowdMode ?? "balanced";
  const summary = t(`pulseHome.headline.${crowdMode}`, { city });
  const transit = pulse?.transportHealth;

  return (
    <section className="section-band">
      <div className="page-shell">
        <SectionHeading
          eyebrow={t("pulseConsole.badge")}
          title={t("pulseConsole.title")}
          description={summary}
          action={
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
              {t("common.refresh")}
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap gap-2">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-40" aria-label={t("common.city")}>
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
            <SelectTrigger className="w-44" aria-label={t("common.vibe")}>
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
            <SelectTrigger className="w-36" aria-label={t("common.hours")}>
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

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_340px] xl:gap-12">
          <div className="space-y-8">
            <GooglePlacesMap
              places={allPlaces}
              title={t("pulseConsole.kosovoMap")}
              subtitle={t("pulseConsole.mapText")}
              className="min-h-[480px]"
              variant="card"
              theme="auto"
              defaultZoom={8}
              fitPadding={64}
              focusZoom={14}
              selectedPlaceId={selectedPlaceId}
              onSelectedPlaceChange={handleMapSelection}
            />

            <div>
              <h2 className="font-serif text-xl">{t("pulseHome.popularMoods")}</h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {loading && !pulse
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <li key={`zone-skeleton-${index}`} className="py-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="mt-2 h-4 w-64" />
                      </li>
                    ))
                  : (pulse?.zones ?? []).map((zone) => {
                      const active = selectedPlaceId === zone.id;
                      return (
                        <li key={zone.id}>
                          <button
                            type="button"
                            ref={(element) => setZoneCardRef(zone.id, element)}
                            onClick={() => setSelectedPlaceId(zone.id)}
                            aria-pressed={active}
                            className={cn(
                              "flex w-full items-start justify-between gap-6 py-4 text-left transition-colors",
                              active ? "text-foreground" : "text-foreground/90 hover:text-foreground"
                            )}
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2 font-medium">
                                {zone.title}
                                {active && (
                                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                                    <MapPin className="h-3 w-3" aria-hidden="true" />
                                    {t("pulseConsole.mapFocus")}
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-sm text-muted-foreground">
                                {labels.vibe(zone.primaryVibe)} · {zone.city}
                              </span>
                            </span>
                            <span className="shrink-0 pt-0.5 text-sm text-muted-foreground">
                              {labels.availability(zone.demandLevel)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
              </ul>
            </div>
          </div>

          <aside className="space-y-8">
            <div>
              <h2 className="flex items-center gap-2 font-serif text-xl">
                <Route className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("pulseConsole.transportHealth")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {(transit?.averageReliability ?? 0) >= 75
                  ? t("pulseHome.transitGood")
                  : (transit?.averageReliability ?? 0) >= 60
                    ? t("pulseHome.transitOkay")
                    : t("pulseHome.transitSlow")}
              </p>
              {transit?.bestPoint && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {transit.bestPoint}
                  {transit.weakestPoint && transit.weakestPoint !== transit.bestPoint
                    ? ` · ${transit.weakestPoint}`
                    : ""}
                </p>
              )}
            </div>

            <div>
              <h2 className="font-serif text-xl">{t("pulseConsole.topVibes")}</h2>
              <ul className="mt-4 space-y-4">
                {(pulse?.topVibes ?? []).slice(0, 5).map((item) => (
                  <li key={item.vibe}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span>{labels.vibe(item.vibe)}</span>
                      <span className="text-muted-foreground">{labels.availability(item.score >= 70 ? "high" : item.score >= 48 ? "medium" : "low")}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${item.score}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {!!pulse?.supplyGaps.length && (
              <div>
                <h2 className="font-serif text-xl">{t("pulseConsole.supplyGaps")}</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {pulse.supplyGaps.map((gap) => (
                    <li key={gap.vibe} className="flex items-baseline justify-between gap-4">
                      <span>{labels.vibe(gap.vibe)}</span>
                      <span className="shrink-0">{gap.supply}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
