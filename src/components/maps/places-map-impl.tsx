"use client";

import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, ExternalLink, Loader2, MapPin, Navigation, Route, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
  useMap
} from "react-leaflet";
import { useTranslation } from "react-i18next";

import { ResilientPlaceImage } from "@/components/places/resilient-place-image";
import { Button } from "@/components/ui/button";
import {
  googleMapsDirectionsUrl,
  googleMapsNavigationUrl,
  googleMapsSearchUrl,
  KOSOVO_BOUNDS,
  KOSOVO_CENTER,
  validatePlacesForKosovoMap
} from "@/lib/geo";
import { ensureLeafletMap, getLeafletTile } from "@/lib/leaflet-map-loader";
import { getPlaceImageCandidates } from "@/lib/place-images";
import { cn } from "@/lib/utils";
import type { Coordinates, PlaceDTO } from "@/types";

type MapVariant = "glass" | "card";
type MapTheme = "auto" | "dark" | "light";
export type MapSelectionSource = "marker" | "programmatic";

type MarkerGroup = {
  id: string;
  places: PlaceDTO[];
  position: Coordinates;
  isCluster: boolean;
};

type PlacesMapProps = {
  places: PlaceDTO[];
  title?: string;
  subtitle?: string;
  className?: string;
  mapClassName?: string;
  variant?: MapVariant;
  theme?: MapTheme;
  defaultZoom?: number;
  fitPadding?: number;
  focusZoom?: number;
  animatedMarkers?: boolean;
  selectedPlaceId?: string | null;
  defaultSelectedPlaceId?: string | null;
  onSelectedPlaceChange?: (place: PlaceDTO, source: MapSelectionSource) => void;
};

const categoryColors: Record<string, string> = {
  accommodations: "#2563eb",
  attractions: "#06b6d4",
  restaurants: "#ef4444",
  cafes: "#f59e0b",
  experiences: "#8b5cf6",
  hotels: "#2563eb",
  nightlife: "#ec4899",
  nature: "#22c55e",
  culture: "#38bdf8",
  events: "#8b5cf6",
  parks: "#14b8a6",
  shopping: "#f97316",
  stay: "#2563eb"
};

const categoryGlyphs: Record<string, string> = {
  accommodations: "H",
  attractions: "A",
  cafes: "C",
  culture: "A",
  events: "E",
  experiences: "E",
  hotels: "H",
  nature: "N",
  nightlife: "M",
  parks: "N",
  restaurants: "R",
  shopping: "S",
  stay: "H"
};

const categoryTypeColors: Record<string, string> = {
  CULTURE: "#38bdf8",
  EVENT: "#8b5cf6",
  FOOD: "#ef4444",
  NATURE: "#22c55e",
  NIGHTLIFE: "#ec4899",
  SHOPPING: "#f97316",
  STAY: "#2563eb",
  WELLNESS: "#14b8a6"
};

function resolveUsesDarkMap(theme: MapTheme) {
  if (typeof document === "undefined") return false;
  if (theme === "dark") return true;
  if (theme === "light") return false;

  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function projectToWorldPixel(coordinates: Coordinates, zoom: number) {
  const sinLat = Math.min(Math.max(Math.sin((coordinates.lat * Math.PI) / 180), -0.9999), 0.9999);
  const scale = 256 * 2 ** zoom;

  return {
    x: ((coordinates.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function clusterPlaces(places: PlaceDTO[], zoom: number): MarkerGroup[] {
  if (places.length <= 50 || zoom >= 13) {
    return places.map((place) => ({
      id: place.id,
      places: [place],
      position: place.coordinates,
      isCluster: false
    }));
  }

  const buckets = new Map<string, PlaceDTO[]>();
  const cellSize = zoom < 9 ? 86 : 68;

  for (const place of places) {
    const point = projectToWorldPixel(place.coordinates, zoom);
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(place);
    } else {
      buckets.set(key, [place]);
    }
  }

  return Array.from(buckets.entries()).map(([id, bucket]) => {
    if (bucket.length === 1) {
      return {
        id: bucket[0].id,
        places: bucket,
        position: bucket[0].coordinates,
        isCluster: false
      };
    }

    return {
      id: `cluster-${id}`,
      places: bucket,
      position: {
        lat: bucket.reduce((total, place) => total + place.coordinates.lat, 0) / bucket.length,
        lng: bucket.reduce((total, place) => total + place.coordinates.lng, 0) / bucket.length
      },
      isCluster: true
    };
  });
}

function markerHtml(color: string, glyph: string, { selected, pulsing }: { selected: boolean; pulsing: boolean }) {
  const size = selected ? 48 : 42;

  return `
    <div class="leaflet-stay-kosovo-marker" data-selected="${selected ? "1" : "0"}">
      ${
        selected
          ? `<span class="leaflet-stay-kosovo-marker__halo" style="background:${color}"></span>`
          : ""
      }
      ${
        pulsing
          ? `<span class="leaflet-stay-kosovo-marker__pulse" style="background:${color}"></span>`
          : ""
      }
      <span class="leaflet-stay-kosovo-marker__pin" style="background:${color}">
        <span class="leaflet-stay-kosovo-marker__glyph">${glyph}</span>
      </span>
    </div>
    <style>
      .leaflet-stay-kosovo-marker {
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: grid;
        place-items: center;
      }
      .leaflet-stay-kosovo-marker__halo {
        position: absolute;
        inset: 4px;
        border-radius: 999px;
        opacity: 0.22;
      }
      .leaflet-stay-kosovo-marker__pulse {
        position: absolute;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        animation: leaflet-stay-kosovo-pulse 1.9s ease-in-out infinite;
      }
      .leaflet-stay-kosovo-marker__pin {
        position: relative;
        width: ${size - 8}px;
        height: ${size - 8}px;
        border-radius: 50% 50% 50% 4px;
        transform: rotate(-45deg);
        border: 2.5px solid white;
        box-shadow: 0 6px 18px rgba(2, 6, 23, 0.45);
        display: grid;
        place-items: center;
      }
      .leaflet-stay-kosovo-marker__glyph {
        transform: rotate(45deg);
        color: white;
        font-family: Inter, Arial, sans-serif;
        font-weight: 850;
        font-size: 12px;
        line-height: 1;
      }
      @keyframes leaflet-stay-kosovo-pulse {
        0% { transform: scale(0.7); opacity: 0.32; }
        50% { transform: scale(1.3); opacity: 0.06; }
        100% { transform: scale(0.7); opacity: 0.32; }
      }
    </style>
  `;
}

function clusterHtml(size: number, count: number) {
  return `
    <div class="leaflet-stay-kosovo-cluster" style="width:${size}px;height:${size}px;">
      <span class="leaflet-stay-kosovo-cluster__outer"></span>
      <span class="leaflet-stay-kosovo-cluster__inner"></span>
      <span class="leaflet-stay-kosovo-cluster__count">${count}</span>
    </div>
    <style>
      .leaflet-stay-kosovo-cluster {
        position: relative;
        display: grid;
        place-items: center;
      }
      .leaflet-stay-kosovo-cluster__outer {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: #14b8a6;
        opacity: 0.35;
      }
      .leaflet-stay-kosovo-cluster__inner {
        position: absolute;
        inset: 6px;
        border-radius: 999px;
        background: #0f766e;
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(2, 6, 23, 0.5);
      }
      .leaflet-stay-kosovo-cluster__count {
        position: relative;
        color: white;
        font-family: Inter, Arial, sans-serif;
        font-weight: 800;
        font-size: 13px;
        z-index: 1;
      }
    </style>
  `;
}

function buildDivIcon(html: string, size: [number, number]) {
  return L.divIcon({
    className: "leaflet-stay-kosovo-icon",
    html,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2]
  });
}

function MapPopupContent({ place, detailsLabel }: { place: PlaceDTO; detailsLabel: string }) {
  const candidates = getPlaceImageCandidates(place, 320);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const src = candidates[imgIndex];

  useEffect(() => {
    setImgIndex(0);
    setImgError(false);
  }, [place.id]);

  return (
    <div className="w-[292px] max-w-[292px] font-sans text-slate-900">
      <div className="flex gap-3 items-start">
        <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-lg bg-slate-900">
          {src && !imgError ? (
            <Image
              src={src}
              alt={place.title}
              width={74}
              height={74}
              className="h-full w-full object-cover"
              onError={() => {
                if (imgIndex < candidates.length - 1) {
                  setImgIndex((i) => i + 1);
                } else {
                  setImgError(true);
                }
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-900 via-slate-950 to-rose-950 text-xs font-extrabold text-white/80">
              {place.city.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 text-[15px] font-extrabold leading-tight text-slate-900">{place.title}</p>
              <p className="m-0 mt-1 text-xs leading-tight text-slate-500">{place.city} · {place.category.name}</p>
            </div>
            {place.rating > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-extrabold text-amber-800">
                <Star className="h-3 w-3 fill-current" />
                {place.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="m-0 mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">{place.description}</p>
        </div>
      </div>
      <Link
        href={`/discover/${place.slug}`}
        className="mt-3 inline-flex items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-xs font-extrabold text-white no-underline hover:bg-teal-600"
      >
        {detailsLabel}
      </Link>
    </div>
  );
}

type MapBridgeProps = {
  bounds: L.LatLngBounds | null;
  center: Coordinates;
  zoom: number;
  focusTarget: { position: Coordinates; zoom: number } | null;
  fitPadding: number;
  usesDark: boolean;
  onZoomChange: (zoom: number) => void;
};

function MapBridge({ bounds, center, zoom, focusTarget, fitPadding, usesDark, onZoomChange }: MapBridgeProps) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    const handler = () => onZoomChange(map.getZoom());
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [map, onZoomChange]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [fitPadding, fitPadding] });
      initializedRef.current = true;
      return;
    }

    if (!initializedRef.current) {
      map.setView([center.lat, center.lng], zoom);
      initializedRef.current = true;
    }
  }, [bounds, center.lat, center.lng, fitPadding, map, zoom]);

  useEffect(() => {
    if (!focusTarget) return;
    map.flyTo([focusTarget.position.lat, focusTarget.position.lng], focusTarget.zoom, { duration: 0.6 });
  }, [focusTarget, map]);

  useEffect(() => {
    const container = map.getContainer();
    container.style.background = usesDark ? "#0f172a" : "#dbeafe";
  }, [map, usesDark]);

  return null;
}

export function PlacesMapImpl({
  places,
  title,
  subtitle,
  className,
  mapClassName,
  variant = "card",
  theme = "auto",
  defaultZoom = 9,
  fitPadding = 56,
  focusZoom = 14,
  animatedMarkers = false,
  selectedPlaceId: controlledSelectedPlaceId,
  defaultSelectedPlaceId = null,
  onSelectedPlaceChange
}: PlacesMapProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [zoom, setZoom] = useState(defaultZoom);
  const [usesDark, setUsesDark] = useState<boolean>(() => resolveUsesDarkMap(theme));
  const [internalSelectedPlaceId, setInternalSelectedPlaceId] = useState<string | null>(defaultSelectedPlaceId);
  const selectedPlaceId = controlledSelectedPlaceId !== undefined ? controlledSelectedPlaceId : internalSelectedPlaceId;
  const [focusTarget, setFocusTarget] = useState<{ position: Coordinates; zoom: number } | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const mapRef = useRef<LeafletMap | null>(null);

  const { validPlaces, invalidRecords } = useMemo(() => validatePlacesForKosovoMap(places), [places]);
  const validPlaceKey = useMemo(() => validPlaces.map((place) => place.id).join("|"), [validPlaces]);
  const selectedPlace = selectedPlaceId ? validPlaces.find((place) => place.id === selectedPlaceId) : undefined;
  const markerGroups = useMemo(() => clusterPlaces(validPlaces, zoom), [validPlaces, zoom]);
  const isControlledSelection = controlledSelectedPlaceId !== undefined;

  const selectPlace = useCallback(
    (place: PlaceDTO, source: MapSelectionSource) => {
      if (!isControlledSelection) {
        setInternalSelectedPlaceId(place.id);
      }
      onSelectedPlaceChange?.(place, source);
    },
    [isControlledSelection, onSelectedPlaceChange]
  );

  useEffect(() => {
    if (invalidRecords.length > 0) {
      console.warn("[Stay Kosovo map] Invalid place coordinates skipped:", invalidRecords);
    }
  }, [invalidRecords]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    ensureLeafletMap()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn("[Stay Kosovo map] Leaflet failed to load:", error);
        setStatus("fallback");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUsesDark(resolveUsesDarkMap(theme));
  }, [theme]);

  useEffect(() => {
    if (theme !== "auto") return;
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(() => setUsesDark(resolveUsesDarkMap("auto")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onChange = () => setUsesDark(resolveUsesDarkMap("auto"));
    media.addEventListener("change", onChange);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onChange);
    };
  }, [theme]);

  useEffect(() => {
    if (!selectedPlace) return;
    setFocusTarget({ position: selectedPlace.coordinates, zoom: focusZoom });
  }, [focusZoom, selectedPlace]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    const marker = markerRefs.current.get(selectedPlaceId);
    marker?.openPopup();
  }, [selectedPlaceId]);

  const handleZoomChange = useCallback((next: number) => {
    setZoom(next);
  }, []);

  const bounds: L.LatLngBounds | null = useMemo(() => {
    if (validPlaces.length < 2) return null;
    const lats = validPlaces.map((place) => place.coordinates.lat);
    const lngs = validPlaces.map((place) => place.coordinates.lng);
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [validPlaces]);

  const tile = useMemo(() => getLeafletTile(usesDark), [usesDark]);

  const isGlass = variant === "glass";
  const detailPanelClassName = isGlass
    ? "border-white/15 bg-slate-950/76 text-white"
    : "border-border bg-background/95 text-foreground";
  const mutedTextClassName = isGlass ? "text-white/72" : "text-muted-foreground";
  const actionVariant = isGlass ? "glass" : "outline";

  return (
    <div
      className={cn(
        "relative isolate min-h-[360px] overflow-hidden rounded-lg border",
        isGlass ? "border-white/20 bg-white/[0.12] text-white shadow-pulse backdrop-blur-2xl" : "border-border bg-card shadow-card",
        className
      )}
    >
      <div
        className={cn("absolute inset-0", mapClassName)}
        aria-label={title ?? t("googleMap.label")}
      >
        {status === "ready" && (
          <MapContainer
            ref={(instance) => {
              mapRef.current = instance;
            }}
            center={[KOSOVO_CENTER.lat, KOSOVO_CENTER.lng]}
            zoom={defaultZoom}
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
            style={{ background: usesDark ? "#0f172a" : "#dbeafe" }}
          >
            <MapBridge
              bounds={validPlaceKey ? bounds : null}
              center={KOSOVO_CENTER}
              zoom={defaultZoom}
              focusTarget={focusTarget}
              fitPadding={fitPadding}
              usesDark={usesDark}
              onZoomChange={handleZoomChange}
            />
            <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
            {markerGroups.map((group) => {
              if (group.isCluster) {
                const size = Math.min(58, 42 + group.places.length);
                return (
                  <Marker
                    key={group.id}
                    position={[group.position.lat, group.position.lng]}
                    icon={buildDivIcon(clusterHtml(size, group.places.length), [size, size])}
                    eventHandlers={{
                      click: () => {
                        if (!mapRef.current) return;
                        const lats = group.places.map((place) => place.coordinates.lat);
                        const lngs = group.places.map((place) => place.coordinates.lng);
                        const latLngBounds = L.latLngBounds(
                          [Math.min(...lats), Math.min(...lngs)],
                          [Math.max(...lats), Math.max(...lngs)]
                        );
                        mapRef.current.fitBounds(latLngBounds, { padding: [72, 72] });
                      }
                    }}
                  />
                );
              }

              const place = group.places[0];
              const selected = place.id === selectedPlaceId;
              const color = categoryColors[place.category.slug] ?? categoryTypeColors[place.category.type] ?? "#0f766e";
              const glyph = categoryGlyphs[place.category.slug] ?? place.category.name.slice(0, 1).toUpperCase();
              const icon = buildDivIcon(
                markerHtml(color, glyph, { selected, pulsing: animatedMarkers || selected }),
                [selected ? 48 : 42, selected ? 48 : 42]
              );

              return (
                <Marker
                  key={place.id}
                  position={[place.coordinates.lat, place.coordinates.lng]}
                  icon={icon}
                  zIndexOffset={selected ? 1000 : 100}
                  eventHandlers={{
                    click: () => {
                      selectPlace(place, "marker");
                    }
                  }}
                  ref={(instance) => {
                    if (instance) {
                      markerRefs.current.set(place.id, instance);
                    } else {
                      markerRefs.current.delete(place.id);
                    }
                  }}
                >
                  <Popup
                    closeButton={false}
                    autoPan
                    maxWidth={324}
                  >
                    <MapPopupContent place={place} detailsLabel={t("googleMap.details")} />
                  </Popup>
                </Marker>
              );
            })}
            <ZoomControl position="bottomright" />
            <AttributionControl position="bottomleft" prefix={false} />
          </MapContainer>
        )}
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-background/88 text-foreground backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {t("googleMap.loading")}
          </div>
        </div>
      )}

      {status === "fallback" && (
        <div className="absolute inset-0 grid place-items-center bg-background/92 p-5 text-foreground backdrop-blur-sm">
          <div className="max-w-md rounded-lg border border-border bg-card p-4 shadow-glass">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("googleMap.unavailableTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("googleMap.unavailableText", { message: "Leaflet" })}
            </p>
          </div>
        </div>
      )}

      {validPlaces.length === 0 && status === "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-background/92 p-5 text-foreground backdrop-blur-sm">
          <div className="max-w-md rounded-lg border border-border bg-card p-4 shadow-glass">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("googleMap.emptyTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("googleMap.emptyText")}
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/38 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/58 to-transparent" />

      {(title || subtitle) && (
        <div className="pointer-events-none absolute left-4 right-4 top-4">
          <div className={cn("w-fit rounded-md border px-3 py-2 shadow-sm backdrop-blur-xl", detailPanelClassName)}>
            {title && <p className="text-sm font-semibold">{title}</p>}
            {subtitle && <p className={cn("mt-1 max-w-sm text-xs", mutedTextClassName)}>{subtitle}</p>}
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className={cn("absolute bottom-4 left-4 right-4 rounded-lg border p-3 shadow-glass backdrop-blur-xl", detailPanelClassName)}>
          <div className="flex gap-3">
            <ResilientPlaceImage
              place={selectedPlace}
              width={96}
              height={80}
              imageWidth={320}
              className="h-20 w-24 shrink-0 rounded-md object-cover"
              fallbackClassName="h-20 w-24 shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{selectedPlace.title}</p>
                  <p className={cn("mt-1 flex items-center gap-1 text-xs", mutedTextClassName)}>
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedPlace.city} · {selectedPlace.category.name}
                  </p>
                </div>
                {selectedPlace.rating > 0 && (
                  <span className="flex items-center gap-1 rounded-md bg-amber-400/18 px-2 py-1 text-xs font-semibold text-amber-200">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {selectedPlace.rating}
                  </span>
                )}
              </div>
              <p className={cn("mt-2 line-clamp-2 text-xs leading-5", mutedTextClassName)}>{selectedPlace.description}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button asChild variant={actionVariant} size="sm" className="min-w-0 px-2 text-xs">
              <Link href={`/discover/${selectedPlace.slug}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                {t("googleMap.details")}
              </Link>
            </Button>
            <Button asChild variant={actionVariant} size="sm" className="min-w-0 px-2 text-xs">
              <a href={googleMapsSearchUrl(selectedPlace.coordinates)} target="_blank" rel="noreferrer">
                <MapPin className="h-3.5 w-3.5" />
                {t("googleMap.open")}
              </a>
            </Button>
            <Button asChild variant={actionVariant} size="sm" className="min-w-0 px-2 text-xs">
              <a href={googleMapsDirectionsUrl(selectedPlace.coordinates)} target="_blank" rel="noreferrer">
                <Route className="h-3.5 w-3.5" />
                {t("googleMap.directions")}
              </a>
            </Button>
            <Button asChild variant={actionVariant} size="sm" className="min-w-0 px-2 text-xs">
              <a href={googleMapsNavigationUrl(selectedPlace.coordinates)} target="_blank" rel="noreferrer">
                <Navigation className="h-3.5 w-3.5" />
                {t("googleMap.navigate")}
              </a>
            </Button>
          </div>

          {invalidRecords.length > 0 && (
            <p className={cn("mt-2 text-[11px]", mutedTextClassName)}>
              {t("googleMap.invalidSkipped", { count: invalidRecords.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
