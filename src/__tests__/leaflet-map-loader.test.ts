import { describe, expect, it } from "vitest";

import { DEFAULT_LEAFLET_TILE, DARK_LEAFLET_TILE, ensureLeafletMap, getLeafletTile } from "@/lib/leaflet-map-loader";

describe("leaflet-map-loader", () => {
  it("returns the OSM tile config for light mode", () => {
    expect(getLeafletTile(false)).toBe(DEFAULT_LEAFLET_TILE);
  });

  it("returns the CARTO dark tile config for dark mode", () => {
    expect(getLeafletTile(true)).toBe(DARK_LEAFLET_TILE);
  });

  it("loads the leaflet module in a browser environment", async () => {
    await expect(ensureLeafletMap()).resolves.toBeUndefined();
  });
});
