"use client";

import { Activity, ArrowUpRight, Bus, MapPin, MapPinned, RadioTower, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap, type MapSelectionSource } from "@/components/maps/google-places-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experienceCardKeyframes, homePulseCardStyle, pulseIntensityTone } from "@/components/ui/experience-card-effects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { ALL_KOSOVO_CITY, filterPlacesByCity, getPlaceCityOptions, validatePlaceCityAssignments } from "@/lib/place-options";
import { cn } from "@/lib/utils";
import { generateExperiencePulse } from "@/services/pulse-engine";

export function PulseCommandCenter() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [city, setCity] = useState(ALL_KOSOVO_CITY);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [switchingCity, setSwitchingCity] = useState(false);
  const zoneCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const cityOptions = useMemo(() => getPlaceCityOptions(places), []);
  const invalidCityRecords = useMemo(() => validatePlaceCityAssignments(places), []);
  const pulse = useMemo(
    () => generateExperiencePulse({ city, dayPart: "EVENING", vibe: "Nightlife" }),
    [city]
  );
  const pulsePlaces = useMemo(() => filterPlacesByCity(places, city), [city]);
  const mapPlaces = pulsePlaces.length ? pulsePlaces : places;
  const pulseZoneIds = useMemo(() => new Set(pulse.zones.map((zone) => zone.id)), [pulse.zones]);
  const cityLabel = city === ALL_KOSOVO_CITY ? t("common.allKosovo") : city;
  const tonightLabel =
    city === ALL_KOSOVO_CITY ? t("pulseHome.tonightAcrossKosovo") : t("pulseHome.tonightIn", { city });

  const selectCity = (value: string) => {
    setSwitchingCity(true);
    setCity(value);
  };

  const setZoneCardRef = useCallback((placeId: string, element: HTMLElement | null) => {
    if (element) {
      zoneCardRefs.current.set(placeId, element);
    } else {
      zoneCardRefs.current.delete(placeId);
    }
  }, []);

  const selectPulsePlace = useCallback((placeId: string) => {
    setSelectedPlaceId(placeId);
  }, []);

  const handleMapSelection = useCallback(
    (place: (typeof places)[number], source: MapSelectionSource) => {
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
    if (invalidCityRecords.length > 0) {
      console.warn("[Stay Kosovo pulse home] Places with missing city values:", invalidCityRecords);
    }
  }, [invalidCityRecords]);

  useEffect(() => {
    setSelectedPlaceId((current) => (current && mapPlaces.some((place) => place.id === current) ? current : null));
  }, [mapPlaces]);

  useEffect(() => {
    if (!switchingCity) return;

    const timer = window.setTimeout(() => setSwitchingCity(false), 180);
    return () => window.clearTimeout(timer);
  }, [switchingCity]);

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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="grid gap-1 text-sm font-medium">
                <span className="text-muted-foreground">{t("pulseHome.cityLabel")}</span>
                <Select value={city} onValueChange={selectCity}>
                  <SelectTrigger className="min-w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_KOSOVO_CITY}>{t("common.allKosovo")}</SelectItem>
                    {cityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button asChild variant="outline">
                <Link href="/pulse">
                  {t("pulseHome.openConsole")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className={cn("grid gap-3 transition-opacity md:grid-cols-3", switchingCity && "opacity-60")}>
            {pulse.insights.map((insight) => (
              <article key={insight.label} className="experience-card-home p-4">
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <p className="mt-2 text-3xl font-bold">{insight.value}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
              </article>
            ))}
          </div>

          <GooglePlacesMap
            places={mapPlaces}
            title={t("pulseHome.mapTitle", { city: cityLabel })}
            subtitle={switchingCity ? t("common.loading") : t("pulseHome.mapText")}
            className="min-h-[360px]"
            variant="card"
            theme="auto"
            defaultZoom={8}
            fitPadding={58}
            focusZoom={14}
            animatedMarkers
            selectedPlaceId={selectedPlaceId}
            onSelectedPlaceChange={handleMapSelection}
          />

          <div className="grid gap-3 md:grid-cols-2">
            {pulse.zones.length ? pulse.zones.slice(0, 4).map((zone) => (
              <article
                key={zone.id}
                ref={(element) => setZoneCardRef(zone.id, element)}
                style={homePulseCardStyle(zone.intensity, hoveredZoneId === zone.id || selectedPlaceId === zone.id)}
                className={cn(
                  "experience-card-home group relative cursor-pointer overflow-hidden p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55",
                  selectedPlaceId === zone.id && "ring-2 ring-primary/35"
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
                    <p className="mt-1 text-sm text-muted-foreground">{zone.city} · {labels.vibe(zone.primaryVibe)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-md text-sm font-bold"
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
                    {selectedPlaceId === zone.id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.12] px-2 py-1 text-[11px] font-semibold text-primary">
                        <MapPin className="h-3 w-3" />
                        {t("pulseHome.mapFocus")}
                      </span>
                    )}
                  </div>
                </div>
                <p className="relative z-10 mt-3 text-sm leading-6 text-muted-foreground">{zone.summary}</p>
                <div className="relative z-10 mt-3 flex flex-wrap gap-2">
                  <Badge variant={pulseIntensityTone(zone.intensity)}>
                    {labels.availability(zone.demandLevel)}
                  </Badge>
                  <Badge variant="outline">{t("pulseHome.mobility", { value: labels.availability(zone.mobilityPressure) })}</Badge>
                </div>
              </article>
            )) : (
              <div className="experience-card-home p-5 md:col-span-2">
                <p className="font-semibold">{t("pulseHome.emptyTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("pulseHome.emptyText")}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit overflow-hidden rounded-lg border border-white/[0.12] bg-slate-950 p-5 text-white shadow-pulse">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{tonightLabel}</p>
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
