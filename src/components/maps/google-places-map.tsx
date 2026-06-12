"use client";

import { AlertTriangle, ExternalLink, Loader2, MapPin, Navigation, Route, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  googleMapsDirectionsUrl,
  googleMapsNavigationUrl,
  googleMapsSearchUrl,
  KOSOVO_BOUNDS,
  KOSOVO_CENTER,
  validatePlacesForKosovoMap
} from "@/lib/geo";
import { cn } from "@/lib/utils";
import {
  type GoogleMapInstance,
  type GoogleMapsApi,
  type GoogleMapStyle,
  type GoogleMarkerInstance,
  loadGoogleMaps
} from "@/lib/google-maps-loader";
import type { Coordinates, PlaceDTO } from "@/types";

type MapVariant = "glass" | "card";
type MapTheme = "auto" | "dark" | "light";

type MarkerGroup = {
  id: string;
  places: PlaceDTO[];
  position: Coordinates;
  isCluster: boolean;
};

type GooglePlacesMapProps = {
  places: PlaceDTO[];
  title?: string;
  subtitle?: string;
  className?: string;
  mapClassName?: string;
  variant?: MapVariant;
  theme?: MapTheme;
  defaultZoom?: number;
  fitPadding?: number;
  animatedMarkers?: boolean;
};

const lightMapStyles: GoogleMapStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d8f3e8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#b9e4ef" }] }
];

const darkMapStyles: GoogleMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#172033" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d6e4f0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#38bdf8" }, { weight: 1.1 }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9cc3d5" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#26374f" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a8bed3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e3a53" }] }
];

const categoryColors: Record<string, string> = {
  restaurants: "#ef4444",
  cafes: "#f59e0b",
  nightlife: "#ec4899",
  nature: "#22c55e",
  culture: "#38bdf8",
  events: "#8b5cf6",
  parks: "#14b8a6"
};

function resolveUsesDarkMap(theme: MapTheme) {
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
    buckets.set(key, [...(buckets.get(key) ?? []), place]);
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

function markerIcon(
  api: GoogleMapsApi,
  color: string,
  {
    selected,
    pulsing,
    hovered
  }: {
    selected: boolean;
    pulsing: boolean;
    hovered: boolean;
  }
) {
  const size = hovered ? 52 : selected ? 48 : 42;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${
        pulsing
          ? `<circle cx="29" cy="32" r="14" fill="${color}" opacity="0.24">
              <animate attributeName="r" values="13;22;13" dur="1.9s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.24;0.04;0.24" dur="1.9s" repeatCount="indefinite"/>
            </circle>`
          : ""
      }
      <g transform="translate(8 15)${hovered ? " scale(1.08 1.08) translate(-1.55 -2.9)" : ""}">
        <path d="M21 39C21 39 34 27.2 34 16.8C34 9.8 28.2 4 21 4C13.8 4 8 9.8 8 16.8C8 27.2 21 39 21 39Z" fill="${color}" stroke="white" stroke-width="2.6"/>
        <circle cx="21" cy="17" r="5.2" fill="white"/>
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new api.maps.Size(size, size),
    anchor: new api.maps.Point(size / 2, (size * 54) / 58),
    labelOrigin: new api.maps.Point(size / 2, (size * 32) / 58)
  };
}

function clusterIcon(api: GoogleMapsApi, size: number) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="#0f766e" fill-opacity="0.92" stroke="white" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 9}" fill="#14b8a6" fill-opacity="0.35"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new api.maps.Size(size, size),
    anchor: new api.maps.Point(size / 2, size / 2),
    labelOrigin: new api.maps.Point(size / 2, size / 2 + 1)
  };
}

function fitPlaces(api: GoogleMapsApi, map: GoogleMapInstance, places: PlaceDTO[], fitPadding: number) {
  if (!places.length) return;

  const bounds = new api.maps.LatLngBounds();
  places.forEach((place) => bounds.extend(place.coordinates));
  map.fitBounds(bounds, fitPadding);

  if (places.length === 1) {
    map.setZoom(14);
  }
}

function googleMapsEmbedUrl(place: PlaceDTO | undefined, zoom: number) {
  const coordinates = place?.coordinates ?? KOSOVO_CENTER;
  const query = encodeURIComponent(`${coordinates.lat},${coordinates.lng}`);

  return `https://www.google.com/maps?q=${query}&z=${zoom}&output=embed`;
}

export function GooglePlacesMap({
  places,
  title,
  subtitle,
  className,
  mapClassName,
  variant = "card",
  theme = "auto",
  defaultZoom = 9,
  fitPadding = 56,
  animatedMarkers = false
}: GooglePlacesMapProps) {
  const { t } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRefs = useRef<GoogleMarkerInstance[]>([]);
  const fitAppliedRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">(apiKey ? "idle" : "fallback");
  const [zoom, setZoom] = useState(defaultZoom);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const { validPlaces, invalidRecords } = useMemo(() => validatePlacesForKosovoMap(places), [places]);
  const selectedPlace = validPlaces.find((place) => place.id === selectedPlaceId) ?? validPlaces[0];
  const markerGroups = useMemo(() => clusterPlaces(validPlaces, zoom), [validPlaces, zoom]);

  useEffect(() => {
    if (invalidRecords.length > 0) {
      console.warn("[Stay Kosovo map] Invalid place coordinates skipped:", invalidRecords);
    }
  }, [invalidRecords]);

  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setStatus("fallback");
      return;
    }

    if (!containerRef.current) return;

    setStatus("loading");

    loadGoogleMaps(apiKey)
      .then((api) => {
        if (cancelled || !containerRef.current) return;

        const usesDarkMap = resolveUsesDarkMap(theme);
        const map = new api.maps.Map(containerRef.current, {
          center: KOSOVO_CENTER,
          zoom: defaultZoom,
          minZoom: 7,
          maxZoom: 18,
          restriction: {
            latLngBounds: KOSOVO_BOUNDS,
            strictBounds: false
          },
          styles: usesDarkMap ? darkMapStyles : lightMapStyles,
          ...(mapId ? { mapId } : {}),
          backgroundColor: usesDarkMap ? "#0f172a" : "#dbeafe",
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
        setZoom(map.getZoom() ?? defaultZoom);
        setStatus("ready");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStatus("fallback");
        console.warn("[Stay Kosovo map] Google Maps JS API failed; using iframe fallback:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, defaultZoom, mapId, theme]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    const map = mapRef.current;
    const listener = map.addListener("zoom_changed", () => setZoom(map.getZoom() ?? defaultZoom));

    return () => listener.remove();
  }, [defaultZoom, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    const map = mapRef.current;
    const updateStyles = () => {
      const usesDarkMap = resolveUsesDarkMap(theme);
      map.setOptions({
        styles: usesDarkMap ? darkMapStyles : lightMapStyles,
        backgroundColor: usesDarkMap ? "#0f172a" : "#dbeafe"
      });
    };

    updateStyles();

    if (theme !== "auto") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(updateStyles);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", updateStyles);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateStyles);
    };
  }, [status, theme]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;

    if (status !== "ready" || !api || !map || !validPlaces.length || fitAppliedRef.current) return;

    fitPlaces(api, map, validPlaces, fitPadding);
    fitAppliedRef.current = true;
  }, [fitPadding, status, validPlaces]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;

    if (status !== "ready" || !api || !map) return;

    markerRefs.current.forEach((marker) => {
      api.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
    markerRefs.current = [];

    for (const group of markerGroups) {
      if (group.isCluster) {
        const size = Math.min(58, 42 + group.places.length);
        const marker = new api.maps.Marker({
          position: group.position,
          map,
          title: t("googleMap.clusterTitle", { count: group.places.length }),
          icon: clusterIcon(api, size),
          label: {
            text: String(group.places.length),
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "800"
          },
          zIndex: 10
        });

        marker.addListener("click", () => fitPlaces(api, map, group.places, 72));
        markerRefs.current.push(marker);
        continue;
      }

      const place = group.places[0];
      const selected = place.id === selectedPlaceId;
      const color = categoryColors[place.category.slug] ?? "#0f766e";
      const getIcon = (hovered: boolean) =>
        markerIcon(api, color, {
          selected,
          pulsing: animatedMarkers,
          hovered
        });
      const marker = new api.maps.Marker({
        position: place.coordinates,
        map,
        title: place.title,
        icon: getIcon(false),
        zIndex: selected ? 20 : 12
      });

      marker.addListener("mouseover", () => {
        marker.setIcon(getIcon(true));
        marker.setZIndex(30);
      });
      marker.addListener("mouseout", () => {
        marker.setIcon(getIcon(false));
        marker.setZIndex(selected ? 20 : 12);
      });
      marker.addListener("click", () => {
        setSelectedPlaceId(place.id);
        map.panTo(place.coordinates);
        if ((map.getZoom() ?? defaultZoom) < 12) map.setZoom(12);
      });
      markerRefs.current.push(marker);
    }
  }, [animatedMarkers, defaultZoom, markerGroups, selectedPlaceId, status, t]);

  useEffect(() => {
    return () => {
      const api = apiRef.current;
      if (!api) return;

      markerRefs.current.forEach((marker) => {
        api.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markerRefs.current = [];
    };
  }, []);

  const isGlass = variant === "glass";
  const detailPanelClassName = isGlass
    ? "border-white/15 bg-slate-950/76 text-white"
    : "border-border bg-background/95 text-foreground";
  const mutedTextClassName = isGlass ? "text-white/72" : "text-muted-foreground";
  const actionVariant = isGlass ? "glass" : "outline";
  const fallbackMapTitle = selectedPlace ? `${selectedPlace.title} Google Maps location` : t("googleMap.label");

  return (
    <div
      className={cn(
        "relative min-h-[360px] overflow-hidden rounded-lg border",
        isGlass ? "border-white/20 bg-white/[0.12] text-white shadow-pulse backdrop-blur-2xl" : "border-border bg-card shadow-card",
        className
      )}
    >
      <div ref={containerRef} className={cn("absolute inset-0", mapClassName)} aria-label={title ?? t("googleMap.label")} />

      {status === "fallback" && validPlaces.length > 0 && (
        <iframe
          key={selectedPlace?.id ?? "kosovo"}
          src={googleMapsEmbedUrl(selectedPlace, selectedPlace ? 14 : defaultZoom)}
          title={fallbackMapTitle}
          className={cn("absolute inset-0 h-full w-full border-0", mapClassName)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-background/88 text-foreground backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {t("googleMap.loading")}
          </div>
        </div>
      )}

      {validPlaces.length === 0 && (
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
            {selectedPlace.images[0] ? (
              <Image
                src={selectedPlace.images[0]}
                alt={selectedPlace.title}
                width={96}
                height={80}
                className="h-20 w-24 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="grid h-20 w-24 shrink-0 place-items-center rounded-md bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
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
