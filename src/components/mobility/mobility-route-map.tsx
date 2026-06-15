"use client";

import { AlertTriangle, Loader2, MapPin, Route } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { KOSOVO_BOUNDS, KOSOVO_CENTER } from "@/lib/geo";
import {
  type GoogleMapInstance,
  type GoogleMapsApi,
  type GooglePolylineInstance,
  loadGoogleMaps
} from "@/lib/google-maps-loader";
import { cn } from "@/lib/utils";
import type { Coordinates, MobilityRoute, PlaceDTO } from "@/types";

type MobilityRouteMapProps = {
  from?: PlaceDTO;
  to?: PlaceDTO;
  route?: MobilityRoute;
  className?: string;
};

function fallbackMapUrl(from: PlaceDTO | undefined, to: PlaceDTO | undefined) {
  if (from && to) {
    const origin = encodeURIComponent(`${from.coordinates.lat},${from.coordinates.lng}`);
    const destination = encodeURIComponent(`${to.coordinates.lat},${to.coordinates.lng}`);
    return `https://www.google.com/maps?output=embed&saddr=${origin}&daddr=${destination}`;
  }

  const center = from?.coordinates ?? to?.coordinates ?? KOSOVO_CENTER;
  return `https://www.google.com/maps/@${center.lat},${center.lng},11z?output=embed`;
}

function makeBounds(api: GoogleMapsApi, points: Coordinates[]) {
  const bounds = new api.maps.LatLngBounds();
  points.forEach((point) => bounds.extend(point));
  return bounds;
}

export function MobilityRouteMap({ from, to, route, className }: MobilityRouteMapProps) {
  const { t } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const polylineRef = useRef<GooglePolylineInstance | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "fallback">(
    apiKey ? "idle" : "fallback"
  );
  const [routeError, setRouteError] = useState(false);

  const routeStatus =
    routeError
      ? "error"
      : route
        ? route.source === "google"
          ? "ready"
          : "fallback"
        : from && to
          ? "loading"
          : "idle";
  const routeTitle = from && to ? `${from.title} ${t("common.to").toLowerCase()} ${to.title}` : t("mobility.routePending");

  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setMapStatus("fallback");
      return;
    }

    if (!containerRef.current) return;

    setMapStatus("loading");

    loadGoogleMaps(apiKey)
      .then((api) => {
        if (cancelled || !containerRef.current) return;

        const map = new api.maps.Map(containerRef.current, {
          center: KOSOVO_CENTER,
          zoom: 9,
          minZoom: 7,
          maxZoom: 18,
          restriction: {
            latLngBounds: KOSOVO_BOUNDS,
            strictBounds: false
          },
          ...(mapId ? { mapId } : {}),
          backgroundColor: "#0f172a",
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
          keyboardShortcuts: true,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true
        });

        apiRef.current = api;
        mapRef.current = map;
        setMapStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setMapStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, mapId]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;

    if (mapStatus !== "ready" || !api || !map) return;

    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    setRouteError(false);

    if (!route || route.points.length < 2) {
      return;
    }

    polylineRef.current = new api.maps.Polyline({
      path: route.points,
      map,
      strokeColor: route.source === "google" ? "#14b8a6" : "#f59e0b",
      strokeOpacity: 0.92,
      strokeWeight: route.source === "google" ? 7 : 5,
      zIndex: 30
    });
    map.fitBounds(makeBounds(api, route.points), 76);

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [mapStatus, route]);

  useEffect(() => {
    return () => {
      polylineRef.current?.setMap(null);
    };
  }, []);

  return (
    <div className={cn("relative min-h-[520px] overflow-hidden rounded-lg border border-white/15 bg-slate-950 text-white shadow-glass", className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label={t("mobility.mapLabel")} />

      {mapStatus === "fallback" && (
        <iframe
          src={fallbackMapUrl(from, to)}
          title={t("mobility.mapLabel")}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {mapStatus === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/88 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {t("googleMap.loading")}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/44 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/68 to-transparent" />

      <div className="absolute left-4 top-4 rounded-md border border-white/15 bg-slate-950/78 px-3 py-2 shadow-glass backdrop-blur-xl">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Route className="h-4 w-4 text-primary" />
          {t("mobility.liveRouteMap")}
        </p>
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-slate-950/82 p-4 shadow-glass backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{routeTitle}</p>
            <p className="mt-1 text-sm text-white/70">{t("mobility.routeVisualization")}</p>
          </div>
          <Badge variant={routeStatus === "ready" ? "green" : routeStatus === "error" ? "rose" : "amber"}>
            {routeStatus === "loading" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            {routeStatus === "ready"
              ? t("mobility.googleRoute")
              : routeStatus === "fallback"
                ? t("mobility.simulatedRoute")
                : routeStatus === "error"
                  ? t("mobility.routeError")
                  : t("mobility.routePending")}
          </Badge>
        </div>
        {from && to && (
          <div className="mt-3 grid gap-2 text-xs text-white/74 sm:grid-cols-2">
            <span className="flex min-w-0 items-center gap-2 rounded-md bg-white/10 px-2 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{from.title}</span>
            </span>
            <span className="flex min-w-0 items-center gap-2 rounded-md bg-white/10 px-2 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-300" />
              <span className="truncate">{to.title}</span>
            </span>
          </div>
        )}
        {routeStatus === "error" && (
          <p className="mt-3 flex items-center gap-2 text-xs text-rose-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("mobility.routeErrorDetail")}
          </p>
        )}
      </div>
    </div>
  );
}
