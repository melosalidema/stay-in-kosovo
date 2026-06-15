"use client";

import { AlertTriangle, Bike, Bus, Car, CarTaxiFront, ExternalLink, Footprints, Leaf, Navigation, Route } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MobilityRouteMap } from "@/components/mobility/mobility-route-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { places } from "@/data/kosovo-data";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { googleMapsRouteUrl } from "@/lib/geo";
import { formatCurrency } from "@/lib/utils";
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
      travelMode: preference === "WALKING" ? "walking" : preference === "BIKE" ? "bicycling" : preference === "BUS" ? "transit" : "driving"
    });
  }, [activeRoute, from, preference, to]);

  useEffect(() => {
    setFrom((current) => (placeMatchesMobilityCity(current, city) ? current : undefined));
    setTo((current) => (placeMatchesMobilityCity(current, city) ? current : undefined));
    setOptions([]);
    setPoints([]);
    setRouteError(null);
  }, [city]);

  const calculate = useCallback(async (signal?: AbortSignal) => {
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
  }, [from, preference, t, to]);

  useEffect(() => {
    const controller = new AbortController();
    void calculate(controller.signal);

    return () => controller.abort();
  }, [calculate]);

  return (
    <section className="section-band">
      <div className="page-shell space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="green" className="mb-3">
              <Route className="mr-1 h-3.5 w-3.5" />
              {t("mobility.badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{t("mobility.title")}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              {t("mobility.description")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-glass">
            <div className="space-y-4">
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
                {t("common.from")}
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
                {t("common.to")}
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
              <label className="grid gap-2 text-sm font-medium">
                {t("common.preference")}
                <Select value={preference} onValueChange={(value) => setPreference(value as TransportMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(methodIcons).map((method) => (
                      <SelectItem key={method} value={method}>
                        {labels.transport(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button className="w-full" size="lg" onClick={() => void calculate()} disabled={loading || !canCalculate}>
                <Navigation className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {t("mobility.calculate")}
              </Button>
              {googleMapsUrl && (
                <Button asChild className="w-full" variant="outline">
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t("common.openInGoogleMaps")}
                  </a>
                </Button>
              )}
              {routeError && (
                <p className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {routeError}
                </p>
              )}
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <MobilityRouteMap from={from} to={to} route={activeRoute} />

            <div className="space-y-4">
              {options.length ? (
                options.map((option) => {
                  const Icon = methodIcons[option.method];
                  return (
                    <article key={option.method} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="font-bold">{option.label}</h3>
                            <p className="text-sm text-muted-foreground">{option.distanceKm} km</p>
                          </div>
                        </div>
                        <Badge variant={option.availability === "high" ? "green" : option.availability === "medium" ? "amber" : "rose"}>
                          {labels.availability(option.availability)}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                        <span className="rounded-md bg-muted p-2">{option.durationMinutes}{t("common.minutesShort")}</span>
                        <span className="rounded-md bg-muted p-2">{formatCurrency(option.estimatedCost)}</span>
                        <span className="rounded-md bg-muted p-2">{option.carbonScore}/100</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.reason}</p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  {t("mobility.empty")}
                </div>
              )}

              {points.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-3 flex items-center gap-2 font-semibold">
                    <Leaf className="h-4 w-4 text-primary" />
                    {t("mobility.nearby")}
                  </p>
                  <div className="space-y-2">
                    {points.map((point) => (
                      <div key={point.id} className="flex items-center justify-between rounded-md bg-muted p-2 text-sm">
                        <span>{point.name}</span>
                        <span className="text-muted-foreground">{point.reliabilityScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
