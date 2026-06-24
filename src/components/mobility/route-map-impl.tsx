"use client";

import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, Loader2, MapPin, Route } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
  useMap
} from "react-leaflet";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { KOSOVO_BOUNDS, KOSOVO_CENTER } from "@/lib/geo";
import { ensureLeafletMap, getLeafletTile } from "@/lib/leaflet-map-loader";
import { cn } from "@/lib/utils";
import type { MobilityRoute, PlaceDTO } from "@/types";

type MobilityRouteMapProps = {
  from?: PlaceDTO;
  to?: PlaceDTO;
  route?: MobilityRoute;
  className?: string;
};

function pinHtml(color: string, label: string) {
  return `
    <div class="leaflet-stay-kosovo-pin">
      <span class="leaflet-stay-kosovo-pin__inner" style="background:${color}">
        <span class="leaflet-stay-kosovo-pin__label">${label}</span>
      </span>
    </div>
    <style>
      .leaflet-stay-kosovo-pin {
        position: relative;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
      }
      .leaflet-stay-kosovo-pin__inner {
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 4px;
        transform: rotate(-45deg);
        border: 2.5px solid white;
        box-shadow: 0 4px 14px rgba(2, 6, 23, 0.55);
        display: grid;
        place-items: center;
      }
      .leaflet-stay-kosovo-pin__label {
        transform: rotate(45deg);
        color: white;
        font-family: Inter, Arial, sans-serif;
        font-weight: 800;
        font-size: 12px;
        line-height: 1;
      }
    </style>
  `;
}

function buildDivIcon(html: string) {
  return L.divIcon({
    className: "leaflet-stay-kosovo-icon",
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

type RouteBridgeProps = {
  bounds: L.LatLngBounds | null;
  padding: number;
};

function RouteBridge({ bounds, padding }: RouteBridgeProps) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [padding, padding] });
  }, [bounds, map, padding]);

  return null;
}

export function MobilityRouteMapImpl({ from, to, route, className }: MobilityRouteMapProps) {
  const { t } = useTranslation();
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [routeError, setRouteError] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMapStatus("loading");
    ensureLeafletMap()
      .then(() => {
        if (!cancelled) setMapStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setMapStatus("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setRouteError(false);
  }, [from?.id, to?.id, route?.polyline]);

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

  const tile = getLeafletTile(true);

  const routeBounds: L.LatLngBounds | null = (() => {
    if (route && route.points.length >= 2) {
      const lats = route.points.map((point) => point.lat);
      const lngs = route.points.map((point) => point.lng);
      return L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
    }
    if (from && to) {
      return L.latLngBounds(
        [from.coordinates.lat, from.coordinates.lng],
        [to.coordinates.lat, to.coordinates.lng]
      );
    }
    return null;
  })();

  return (
    <div className={cn("relative min-h-[520px] overflow-hidden rounded-lg border border-white/15 bg-slate-950 text-white shadow-glass", className)}>
      <div className="absolute inset-0" aria-label={t("mobility.mapLabel")}>
        {mapStatus === "ready" && (
          <MapContainer
            ref={(instance) => {
              mapRef.current = instance;
            }}
            center={[KOSOVO_CENTER.lat, KOSOVO_CENTER.lng]}
            zoom={9}
            minZoom={7}
            maxZoom={18}
            maxBounds={[
              [KOSOVO_BOUNDS.south, KOSOVO_BOUNDS.west],
              [KOSOVO_BOUNDS.north, KOSOVO_BOUNDS.east]
            ]}
            maxBoundsViscosity={0.7}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom
            className="h-full w-full"
            style={{ background: "#0f172a" }}
          >
            <RouteBridge bounds={routeBounds} padding={76} />
            <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
            {from && (
              <Marker
                position={[from.coordinates.lat, from.coordinates.lng]}
                icon={buildDivIcon(pinHtml("#0f766e", "A"))}
              >
                <Popup closeButton={false}>
                  <span className="font-semibold">{from.title}</span>
                </Popup>
              </Marker>
            )}
            {to && (
              <Marker
                position={[to.coordinates.lat, to.coordinates.lng]}
                icon={buildDivIcon(pinHtml("#e11d48", "B"))}
              >
                <Popup closeButton={false}>
                  <span className="font-semibold">{to.title}</span>
                </Popup>
              </Marker>
            )}
            {route && route.points.length >= 2 && (
              <Polyline
                positions={route.points.map((point) => [point.lat, point.lng])}
                pathOptions={{
                  color: route.source === "google" ? "#14b8a6" : "#f59e0b",
                  opacity: 0.92,
                  weight: route.source === "google" ? 7 : 5
                }}
              />
            )}
            <ZoomControl position="bottomright" />
            <AttributionControl position="bottomleft" prefix={false} />
          </MapContainer>
        )}
      </div>

      {mapStatus === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/88 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {t("googleMap.loading")}
          </div>
        </div>
      )}

      {mapStatus === "fallback" && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/88 p-5 text-center text-sm text-white/80">
          {t("googleMap.unavailableTitle")}
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
