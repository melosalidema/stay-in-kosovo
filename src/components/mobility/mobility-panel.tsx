"use client";

import { Bike, Bus, Car, CarTaxiFront, ExternalLink, Footprints, Leaf, Navigation } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MobilityRouteMap } from "@/components/mobility/mobility-route-map";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { googleMapsRouteUrl } from "@/lib/geo";
import { cn, formatCurrency } from "@/lib/utils";
import type { MobilityOption, PlaceDTO, TransportMethod } from "@/types";
import {
  ALL_KOSOVO_CITY,
  filterMobilityPlacesByCity,
  findMobilityPlaceById,
  formatMobilityPlaceLabel,
  getMobilityCityOptions,
  placeMatchesMobilityCity
} from "./location-filtering";

const methodIcons = {
  WALKING: Footprints,
  TAXI: CarTaxiFront,
  BUS: Bus,
  BIKE: Bike,
  CAR: Car
};

const methods = Object.keys(methodIcons) as TransportMethod[];

type ApiResponse = {
  ok: true;
  data: {
    options: MobilityOption[];
    nearbyTransportPoints: Array<{
      id: string;
      name: string;
      city: string;
      reliabilityScore: number;
    }>;
  };
};

function carbonLabelKey(score: number) {
  if (score >= 72) return "mobility.carbonLow";
  if (score >= 45) return "mobility.carbonMedium";
  return "mobility.carbonHigh";
}

export function MobilityPanel() {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const [city, setCity] = useState(ALL_KOSOVO_CITY);
  const [from, setFrom] = useState<PlaceDTO | undefined>(places[3]);
  const [to, setTo] = useState<PlaceDTO | undefined>(places[1]);
  const [preference, setPreference] = useState<TransportMethod>("WALKING");
  const [options, setOptions] = useState<MobilityOption[]>([]);
  const [points, setPoints] = useState<ApiResponse["data"]["nearbyTransportPoints"]>([]);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const cityOptions = useMemo(() => getMobilityCityOptions(places), []);
  const filteredPlaces = useMemo(() => filterMobilityPlacesByCity(places, city), [city]);
  const canCalculate = Boolean(from && to && from.id !== to.id && filteredPlaces.length > 0);
  const activeRoute = options[0]?.route;
  const googleMapsUrl = useMemo(() => {
    if (!from || !to || !activeRoute) return null;

    return googleMapsRouteUrl({
      origin: from.coordinates,
      destination: to.coordinates,
      travelMode:
        preference === "WALKING" ? "walking" : preference === "BIKE" ? "bicycling" : preference === "BUS" ? "transit" : "driving"
    });
  }, [activeRoute, from, preference, to]);

  useEffect(() => {
    setFrom((current) => (placeMatchesMobilityCity(current, city) ? current : undefined));
    setTo((current) => (placeMatchesMobilityCity(current, city) ? current : undefined));
    setOptions([]);
    setPoints([]);
    setRouteError(null);
  }, [city]);

  const calculate = useCallback(
    async (signal?: AbortSignal) => {
      if (!from || !to || from.id === to.id) {
        setOptions([]);
        setPoints([]);
        setRouteError(from && to && from.id === to.id ? t("mobility.sameLocationError") : null);
        return;
      }

      setLoading(true);
      setRouteError(null);

      try {
        const response = await fetch("/api/mobility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            from: from.coordinates,
            to: to.coordinates,
            preference,
            city: to.city
          })
        });
        const payload: ApiResponse = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error("Mobility request failed.");
        }

        setOptions(payload.data.options);
        setPoints(payload.data.nearbyTransportPoints);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setOptions([]);
        setPoints([]);
        setRouteError(t("mobility.routeRequestError"));
      } finally {
        setLoading(false);
      }
    },
    [from, preference, t, to]
  );

  useEffect(() => {
    const controller = new AbortController();
    void calculate(controller.signal);

    return () => controller.abort();
  }, [calculate]);

  return (
    <section className="section-band">
      <div className="page-shell">
        <SectionHeading eyebrow={t("mobility.badge")} title={t("mobility.title")} description={t("mobility.description")} />

        <div className="mt-9 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-12">
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="glass-panel-strong glass-panel space-y-5 rounded-2xl p-4 sm:p-5">
              <label className="grid gap-2 text-sm font-medium">
                {t("common.city")}
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_KOSOVO_CITY}>{t("mobility.allKosovo")}</SelectItem>
                    {cityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                {t("mobility.selectOrigin")}
                <Select value={from?.id ?? ""} onValueChange={(id) => setFrom(findMobilityPlaceById(filteredPlaces, id))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("mobility.selectOrigin")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlaces.length ? (
                      filteredPlaces.map((place) => (
                        <SelectItem key={place.id} value={place.id} disabled={place.id === to?.id}>
                          {formatMobilityPlaceLabel(place, t("mobility.unknownCity"))}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-from-locations" disabled>
                        {t("mobility.noLocationsForCity")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                {t("mobility.selectDestination")}
                <Select value={to?.id ?? ""} onValueChange={(id) => setTo(findMobilityPlaceById(filteredPlaces, id))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("mobility.selectDestination")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlaces.length ? (
                      filteredPlaces.map((place) => (
                        <SelectItem key={place.id} value={place.id} disabled={place.id === from?.id}>
                          {formatMobilityPlaceLabel(place, t("mobility.unknownCity"))}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-to-locations" disabled>
                        {t("mobility.noLocationsForCity")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </label>

              <div className="grid gap-2 text-sm font-medium">
                {t("common.preference")}
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("common.preference")}>
                  {methods.map((method) => {
                    const Icon = methodIcons[method];
                    const active = preference === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPreference(method)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-[background-color,border-color,color,box-shadow] duration-200 ease-calm",
                          active
                            ? "border border-primary bg-primary text-primary-foreground shadow-soft"
                            : "glass-chip border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {labels.transport(method)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => void calculate()} disabled={loading || !canCalculate}>
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {loading ? t("common.loading") : t("mobility.calculate")}
              </Button>

              {googleMapsUrl && (
                <Button asChild className="w-full" variant="outline">
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {t("common.openInGoogleMaps")}
                  </a>
                </Button>
              )}

              {routeError && (
                <p className="rounded-lg border border-destructive/25 bg-destructive/[0.07] p-3 text-sm text-destructive">
                  {routeError}
                </p>
              )}
            </div>
          </aside>

          <div className="space-y-8">
            <MobilityRouteMap from={from} to={to} route={activeRoute} />

            <div className="space-y-3">
              {options.length ? (
                options.map((option) => {
                  const Icon = methodIcons[option.method];
                  return (
                    <article key={option.method} className="surface-raised p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div>
                            <h3 className="font-semibold leading-snug">{option.label}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {option.distanceKm} {t("common.kilometers")} · {labels.availability(option.availability)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-serif text-2xl leading-none tabular-nums">
                            {option.durationMinutes}
                            <span className="ml-0.5 text-sm text-muted-foreground">{t("common.minutesShort")}</span>
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(option.estimatedCost)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {t(carbonLabelKey(option.carbonScore))}
                        </span>
                        {option.reason && <span>{option.reason}</span>}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {t("mobility.empty")}
                </p>
              )}
            </div>

            {points.length > 0 && (
              <div>
                <h2 className="font-serif text-xl">{t("mobility.nearby")}</h2>
                <ul className="mt-4 divide-y divide-border border-y border-border">
                  {points.map((point) => (
                    <li key={point.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span>{point.name}</span>
                      <span className="text-muted-foreground">{point.city}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
