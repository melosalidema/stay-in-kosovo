export type LeafletTileConfig = {
  url: string;
  attribution: string;
  maxZoom?: number;
};

export const DEFAULT_LEAFLET_TILE: LeafletTileConfig = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
};

export const DARK_LEAFLET_TILE: LeafletTileConfig = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19
};

let leafletReady: Promise<void> | null = null;

export function ensureLeafletMap(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet can only load in the browser."));
  }

  if (leafletReady) return leafletReady;

  leafletReady = new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Leaflet failed to load."));
    }, 12000);

    void import("leaflet")
      .then(() => {
        window.clearTimeout(timer);
        resolve();
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error("Leaflet failed to load."));
      });
  });

  return leafletReady;
}

export function getLeafletTile(usesDark: boolean): LeafletTileConfig {
  return usesDark ? DARK_LEAFLET_TILE : DEFAULT_LEAFLET_TILE;
}

export const __testing = { DEFAULT_LEAFLET_TILE, DARK_LEAFLET_TILE };
