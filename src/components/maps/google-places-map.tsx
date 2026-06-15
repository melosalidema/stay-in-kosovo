"use client";

import { AlertTriangle, ExternalLink, Loader2, MapPin, Navigation, Route, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getPlaceImageCandidates } from "@/lib/place-images";
import { cn } from "@/lib/utils";
import {
  type GoogleInfoWindowInstance,
  type GoogleMapInstance,
  type GoogleMapsApi,
  type GoogleMarkerOptions,
  type GoogleMapStyle,
  type GoogleMarkerInstance,
  loadGoogleMaps
} from "@/lib/google-maps-loader";
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
  focusZoom?: number;
  animatedMarkers?: boolean;
  selectedPlaceId?: string | null;
  defaultSelectedPlaceId?: string | null;
  onSelectedPlaceChange?: (place: PlaceDTO, source: MapSelectionSource) => void;
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

function markerIcon(
  color: string,
  glyph: string,
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
        selected
          ? `<circle cx="29" cy="32" r="21" fill="${color}" opacity="0.2"/>
             <circle cx="29" cy="32" r="18" fill="none" stroke="white" stroke-opacity="0.92" stroke-width="2.4"/>`
          : ""
      }
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
        <circle cx="21" cy="17" r="7" fill="white"/>
        <text x="21" y="20.4" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="850" fill="${color}">${glyph}</text>
      </g>
    </svg>
  `;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = svg.trim();
  return wrapper;
}

function clusterIcon(size: number, count: number) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="#0f766e" fill-opacity="0.92" stroke="white" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 9}" fill="#14b8a6" fill-opacity="0.35"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="800" fill="white">${count}</text>
    </svg>
  `;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = svg.trim();
  return wrapper;
}

function detachMarker(marker: GoogleMarkerInstance) {
  if (marker.setMap) {
    marker.setMap(null);
    return;
  }

  marker.map = null;
}

function setMarkerZIndex(marker: GoogleMarkerInstance, zIndex: number) {
  if (marker.setZIndex) {
    marker.setZIndex(zIndex);
    return;
  }

  marker.zIndex = zIndex;
}

function setMarkerContent(marker: GoogleMarkerInstance, content: Node) {
  if (marker.setIcon) {
    marker.setIcon(content);
    return;
  }

  marker.content = content;
}

function createMapMarker(api: GoogleMapsApi, options: GoogleMarkerOptions) {
  if (api.maps.marker?.AdvancedMarkerElement) {
    return new api.maps.marker.AdvancedMarkerElement({
      position: options.position,
      map: options.map,
      title: options.title,
      content: options.icon instanceof Node ? options.icon : undefined,
      gmpClickable: true,
      zIndex: options.zIndex
    });
  }

  return new api.maps.Marker(options);
}

function addMarkerClickListener(marker: GoogleMarkerInstance, handler: () => void) {
  if (marker.addEventListener) {
    marker.addEventListener("gmp-click", handler);
    return;
  }

  marker.addListener("click", handler);
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

function getPlaceCenter(places: PlaceDTO[]) {
  if (!places.length) return KOSOVO_CENTER;

  return {
    lat: places.reduce((total, place) => total + place.coordinates.lat, 0) / places.length,
    lng: places.reduce((total, place) => total + place.coordinates.lng, 0) / places.length
  };
}

function googleMapsEmbedUrl(place: PlaceDTO | undefined, places: PlaceDTO[], zoom: number) {
  const coordinates = place?.coordinates ?? getPlaceCenter(places);

  if (place) {
    const query = encodeURIComponent(`${coordinates.lat},${coordinates.lng}`);
    return `https://www.google.com/maps?q=${query}&z=${zoom}&output=embed`;
  }

  return `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},${zoom}z?output=embed`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function infoWindowContent(place: PlaceDTO, detailsLabel: string) {
  const imageCandidates = getPlaceImageCandidates(place, 320);
  const imageFallbacks = escapeHtml(JSON.stringify(imageCandidates));
  const image = imageCandidates[0]
    ? `<div style="width:74px;height:74px;border-radius:10px;overflow:hidden;flex:0 0 auto;background:#0f172a;">
         <img src="${escapeHtml(imageCandidates[0])}" data-fallbacks="${imageFallbacks}" data-fallback-index="0" alt="" referrerpolicy="no-referrer" style="width:74px;height:74px;object-fit:cover;display:block;" onerror="var f=JSON.parse(this.dataset.fallbacks||'[]');var i=Number(this.dataset.fallbackIndex||0)+1;if(i<f.length){this.dataset.fallbackIndex=String(i);this.src=f[i];}else{this.style.display='none';this.nextElementSibling.style.display='grid';}" />
         <div style="width:74px;height:74px;display:none;place-items:center;color:white;background:linear-gradient(135deg,#134e4a,#0f172a,#881337);font-size:11px;font-weight:800;">${escapeHtml(place.city.slice(0, 2).toUpperCase())}</div>
       </div>`
    : `<div style="width:74px;height:74px;border-radius:10px;background:linear-gradient(135deg,#134e4a,#0f172a,#881337);display:grid;place-items:center;color:white;flex:0 0 auto;font-size:11px;font-weight:800;">${escapeHtml(place.city.slice(0, 2).toUpperCase())}</div>`;
  const rating =
    place.rating > 0
      ? `<span style="display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:#f59e0b1f;color:#92400e;padding:3px 8px;font-size:12px;font-weight:800;">★ ${place.rating.toFixed(1)}</span>`
      : "";

  return `
    <div style="width:292px;max-width:292px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        ${image}
        <div style="min-width:0;flex:1;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
            <div style="min-width:0;">
              <p style="margin:0;font-size:15px;line-height:1.25;font-weight:850;color:#0f172a;">${escapeHtml(place.title)}</p>
              <p style="margin:5px 0 0;font-size:12px;line-height:1.35;color:#475569;">${escapeHtml(place.city)} · ${escapeHtml(place.category.name)}</p>
            </div>
            ${rating}
          </div>
          <p style="margin:8px 0 0;font-size:12px;line-height:1.55;color:#475569;">${escapeHtml(place.description)}</p>
        </div>
      </div>
      <a href="/discover/${escapeHtml(place.slug)}" style="margin-top:12px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#0f766e;color:white;text-decoration:none;font-size:12px;font-weight:800;padding:8px 11px;">${escapeHtml(detailsLabel)}</a>
    </div>
  `;
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
  focusZoom = 14,
  animatedMarkers = false,
  selectedPlaceId: controlledSelectedPlaceId,
  defaultSelectedPlaceId = null,
  onSelectedPlaceChange
}: GooglePlacesMapProps) {
  const { t } = useTranslation();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const resolvedMapId = mapId || "DEMO_MAP_ID";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRefs = useRef<GoogleMarkerInstance[]>([]);
  const markerByPlaceIdRef = useRef<Map<string, GoogleMarkerInstance>>(new Map());
  const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
  const fitAppliedRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">(apiKey ? "idle" : "fallback");
  const [zoom, setZoom] = useState(defaultZoom);
  const [internalSelectedPlaceId, setInternalSelectedPlaceId] = useState<string | null>(defaultSelectedPlaceId);
  const selectedPlaceId = controlledSelectedPlaceId !== undefined ? controlledSelectedPlaceId : internalSelectedPlaceId;

  const { validPlaces, invalidRecords } = useMemo(() => validatePlacesForKosovoMap(places), [places]);
  const validPlaceKey = useMemo(() => validPlaces.map((place) => place.id).join("|"), [validPlaces]);
  const selectedPlace = selectedPlaceId ? validPlaces.find((place) => place.id === selectedPlaceId) : undefined;
  const markerGroups = useMemo(() => clusterPlaces(validPlaces, zoom), [validPlaces, zoom]);
  const isControlledSelection = controlledSelectedPlaceId !== undefined;

  const focusPlace = useCallback(
    (place: PlaceDTO) => {
      const map = mapRef.current;

      if (!map) return;

      map.panTo(place.coordinates);
      if ((map.getZoom() ?? defaultZoom) < focusZoom) {
        window.setTimeout(() => map.setZoom(focusZoom), 120);
      }
    },
    [defaultZoom, focusZoom]
  );

  const openInfoWindow = useCallback(
    (place: PlaceDTO) => {
      const map = mapRef.current;
      const marker = markerByPlaceIdRef.current.get(place.id);
      const infoWindow = infoWindowRef.current;

      if (!map || !marker || !infoWindow) return;

      infoWindow.setContent(infoWindowContent(place, t("googleMap.details")));
      infoWindow.open({ map, anchor: marker, shouldFocus: false });
    },
    [t]
  );

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
    fitAppliedRef.current = false;
  }, [validPlaceKey]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    if (validPlaces.some((place) => place.id === selectedPlaceId)) return;

    if (!isControlledSelection) {
      setInternalSelectedPlaceId(null);
    }
  }, [isControlledSelection, selectedPlaceId, validPlaces]);

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
          ...(!resolvedMapId ? { styles: usesDarkMap ? darkMapStyles : lightMapStyles } : {}),
          ...(resolvedMapId ? { mapId: resolvedMapId } : {}),
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
        infoWindowRef.current = new api.maps.InfoWindow({ maxWidth: 324 });
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
  }, [apiKey, defaultZoom, resolvedMapId, theme]);

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
        ...(!resolvedMapId ? { styles: usesDarkMap ? darkMapStyles : lightMapStyles } : {}),
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
  }, [resolvedMapId, status, theme]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;

    if (status !== "ready" || !api || !map || !validPlaces.length || fitAppliedRef.current) return;

    fitPlaces(api, map, validPlaces, fitPadding);
    fitAppliedRef.current = true;
  }, [fitPadding, status, validPlaces]);

  useEffect(() => {
    if (!selectedPlace) {
      infoWindowRef.current?.close();
      return;
    }

    if (status === "ready") {
      focusPlace(selectedPlace);
      openInfoWindow(selectedPlace);
    }
  }, [focusPlace, openInfoWindow, selectedPlace, status]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;

    if (status !== "ready" || !api || !map) return;

    markerRefs.current.forEach((marker) => {
      api.maps.event.clearInstanceListeners(marker);
      detachMarker(marker);
    });
    markerRefs.current = [];
    markerByPlaceIdRef.current.clear();

    for (const group of markerGroups) {
      if (group.isCluster) {
        const size = Math.min(58, 42 + group.places.length);
        const marker = createMapMarker(api, {
          position: group.position,
          map,
          title: t("googleMap.clusterTitle", { count: group.places.length }),
          icon: clusterIcon(size, group.places.length),
          zIndex: 10
        });

        addMarkerClickListener(marker, () => fitPlaces(api, map, group.places, 72));
        markerRefs.current.push(marker);
        continue;
      }

      const place = group.places[0];
      const selected = place.id === selectedPlaceId;
      const color = categoryColors[place.category.slug] ?? categoryTypeColors[place.category.type] ?? "#0f766e";
      const glyph = categoryGlyphs[place.category.slug] ?? place.category.name.slice(0, 1).toUpperCase();
      const getIcon = (hovered: boolean) =>
        markerIcon(color, glyph, {
          selected,
          pulsing: animatedMarkers || selected,
          hovered
        });
      const marker = createMapMarker(api, {
        position: place.coordinates,
        map,
        title: place.title,
        icon: getIcon(false),
        zIndex: selected ? 20 : 12
      });

      marker.addListener("mouseover", () => {
        setMarkerContent(marker, getIcon(true));
        setMarkerZIndex(marker, 30);
      });
      marker.addListener("mouseout", () => {
        setMarkerContent(marker, getIcon(false));
        setMarkerZIndex(marker, selected ? 20 : 12);
      });
      addMarkerClickListener(marker, () => {
        selectPlace(place, "marker");
        focusPlace(place);
        openInfoWindow(place);
      });
      markerRefs.current.push(marker);
      markerByPlaceIdRef.current.set(place.id, marker);
    }

    if (selectedPlace) {
      openInfoWindow(selectedPlace);
    }
  }, [animatedMarkers, focusPlace, markerGroups, openInfoWindow, selectPlace, selectedPlace, selectedPlaceId, status, t]);

  useEffect(() => {
    const markerByPlaceId = markerByPlaceIdRef.current;

    return () => {
      const api = apiRef.current;
      if (!api) return;

      markerRefs.current.forEach((marker) => {
        api.maps.event.clearInstanceListeners(marker);
        detachMarker(marker);
      });
      markerRefs.current = [];
      markerByPlaceId.clear();
      infoWindowRef.current?.close();
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
          src={googleMapsEmbedUrl(selectedPlace, validPlaces, selectedPlace ? 14 : defaultZoom)}
          title={fallbackMapTitle}
          className={cn("absolute inset-0 h-full w-full border-0", mapClassName)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {status === "fallback" && !selectedPlace && validPlaces.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-slate-950/80 p-3 text-white shadow-glass backdrop-blur-xl sm:right-auto sm:max-w-sm">
          <p className="text-sm font-semibold">{t("googleMap.staticFallbackTitle", { count: validPlaces.length })}</p>
          <p className="mt-1 text-xs leading-5 text-white/72">{t("googleMap.staticFallbackText")}</p>
        </div>
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
