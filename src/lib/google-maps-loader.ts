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

export type GoogleLatLngInstance = {
  lat: () => number;
  lng: () => number;
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
  addEventListener?: (eventName: "gmp-click", handler: EventListener) => void;
  content?: Node | null;
  map?: GoogleMapInstance | null;
  setIcon?: (icon: unknown) => void;
  setMap?: (map: GoogleMapInstance | null) => void;
  setZIndex?: (zIndex: number) => void;
  zIndex?: number | null;
};

export type GooglePolylineInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
};

export type GoogleInfoWindowInstance = {
  close: () => void;
  open: (options: { map: GoogleMapInstance; anchor?: GoogleMarkerInstance | null; shouldFocus?: boolean }) => void;
  setContent: (content: string | Node) => void;
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

export type GoogleAdvancedMarkerOptions = {
  position: Coordinates;
  map: GoogleMapInstance;
  title?: string;
  content?: Node;
  gmpClickable?: boolean;
  zIndex?: number;
};

export type GooglePolylineOptions = {
  path: Coordinates[];
  map?: GoogleMapInstance;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  zIndex?: number;
};

export type GoogleDirectionsLeg = {
  distance?: { value: number; text: string };
  duration?: { value: number; text: string };
};

export type GoogleDirectionsRoute = {
  bounds?: GoogleLatLngBounds;
  legs: GoogleDirectionsLeg[];
  overview_path: GoogleLatLngInstance[];
  overview_polyline?: {
    points: string;
  };
  summary?: string;
  warnings?: string[];
};

export type GoogleDirectionsResult = {
  routes: GoogleDirectionsRoute[];
};

export type GoogleDirectionsRequest = {
  origin: Coordinates;
  destination: Coordinates;
  travelMode: string;
  provideRouteAlternatives?: boolean;
};

export type GoogleDirectionsServiceInstance = {
  route: (
    request: GoogleDirectionsRequest,
    callback: (result: GoogleDirectionsResult | null, status: string) => void
  ) => void;
};

export type GoogleMapsApi = {
  maps: {
    event: {
      clearInstanceListeners: (instance: GoogleMarkerInstance) => void;
    };
    DirectionsService: new () => GoogleDirectionsServiceInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
    InfoWindow: new (options?: { content?: string | Node; maxWidth?: number }) => GoogleInfoWindowInstance;
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    Marker: new (options: GoogleMarkerOptions) => GoogleMarkerInstance;
    marker?: {
      AdvancedMarkerElement: new (options: GoogleAdvancedMarkerOptions) => GoogleMarkerInstance;
    };
    Point: new (x: number, y: number) => unknown;
    Polyline: new (options: GooglePolylineOptions) => GooglePolylineInstance;
    Size: new (width: number, height: number) => unknown;
    TravelMode: {
      BICYCLING: string;
      DRIVING: string;
      TRANSIT: string;
      WALKING: string;
    };
    importLibrary?: (libraryName: "marker") => Promise<{
      AdvancedMarkerElement?: new (options: GoogleAdvancedMarkerOptions) => GoogleMarkerInstance;
    }>;
  };
};

declare global {
  interface Window {
    __stayKosovoGoogleMapsInit?: () => void;
    google?: GoogleMapsApi;
  }
}

let mapsApiPromise: Promise<GoogleMapsApi> | null = null;

async function ensureMarkerLibrary(api: GoogleMapsApi) {
  if (api.maps.marker?.AdvancedMarkerElement || !api.maps.importLibrary) return api;

  const markerLibrary = await api.maps.importLibrary("marker");
  if (markerLibrary.AdvancedMarkerElement) {
    api.maps.marker = { AdvancedMarkerElement: markerLibrary.AdvancedMarkerElement };
  }

  return api;
}

export function loadGoogleMaps(apiKey: string | undefined) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (!apiKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
  }

  if (window.google?.maps) {
    return ensureMarkerLibrary(window.google);
  }

  if (mapsApiPromise) return mapsApiPromise;

  mapsApiPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-stay-kosovo-google-maps]");

    window.__stayKosovoGoogleMapsInit = () => {
      if (window.google?.maps) {
        ensureMarkerLibrary(window.google).then(resolve).catch(reject);
      } else {
        reject(new Error("Google Maps loaded without the maps API."));
      }
    };

    if (existingScript) return;

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      libraries: "marker",
      loading: "async",
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
