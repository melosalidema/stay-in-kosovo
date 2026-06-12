import type { Coordinates } from "@/types";

export type GoogleMapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};

export type GoogleMapOptions = {
  center: Coordinates;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  restriction?: {
    latLngBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    strictBounds: boolean;
  };
  styles?: GoogleMapStyle[];
  mapId?: string;
  backgroundColor?: string;
  clickableIcons?: boolean;
  disableDefaultUI?: boolean;
  fullscreenControl?: boolean;
  gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  keyboardShortcuts?: boolean;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  zoomControl?: boolean;
};

export type GoogleMapListener = {
  remove: () => void;
};

export type GoogleLatLngBounds = {
  extend: (position: Coordinates) => void;
};

export type GoogleMapInstance = {
  addListener: (eventName: string, handler: () => void) => GoogleMapListener;
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
  getZoom: () => number | undefined;
  panTo: (position: Coordinates) => void;
  setOptions: (options: Partial<GoogleMapOptions>) => void;
  setZoom: (zoom: number) => void;
};

export type GoogleMarkerInstance = {
  addListener: (eventName: string, handler: () => void) => GoogleMapListener;
  setIcon: (icon: unknown) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  setZIndex: (zIndex: number) => void;
};

export type GoogleMarkerOptions = {
  position: Coordinates;
  map: GoogleMapInstance;
  title?: string;
  icon?: unknown;
  label?: {
    text: string;
    color: string;
    fontSize?: string;
    fontWeight?: string;
  };
  zIndex?: number;
};

export type GoogleMapsApi = {
  maps: {
    event: {
      clearInstanceListeners: (instance: GoogleMarkerInstance) => void;
    };
    LatLngBounds: new () => GoogleLatLngBounds;
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    Marker: new (options: GoogleMarkerOptions) => GoogleMarkerInstance;
    Point: new (x: number, y: number) => unknown;
    Size: new (width: number, height: number) => unknown;
  };
};

declare global {
  interface Window {
    __stayKosovoGoogleMapsInit?: () => void;
    google?: GoogleMapsApi;
  }
}

let mapsApiPromise: Promise<GoogleMapsApi> | null = null;

export function loadGoogleMaps(apiKey: string | undefined) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (!apiKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (mapsApiPromise) return mapsApiPromise;

  mapsApiPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-stay-kosovo-google-maps]");

    window.__stayKosovoGoogleMapsInit = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps loaded without the maps API."));
      }
    };

    if (existingScript) return;

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      callback: "__stayKosovoGoogleMapsInit"
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.stayKosovoGoogleMaps = "true";
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return mapsApiPromise;
}
