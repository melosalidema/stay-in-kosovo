import { describe, expect, it } from "vitest";

import { buildCsp, cspAllows } from "@/lib/csp";
import { DARK_LEAFLET_TILE, DEFAULT_LEAFLET_TILE, getLeafletTile } from "@/lib/leaflet-map-loader";

/** Resolve a Leaflet tile template to a concrete host, the way Leaflet does. */
function tileHost(urlTemplate: string) {
  return new URL(urlTemplate.replace("https://{s}.", "https://a.")).hostname;
}

describe("map tiles are permitted by the Content Security Policy", () => {
  const csp = buildCsp("test-nonce", true);
  const imgSrc = csp.split("; ").find((d) => d.startsWith("img-src")) ?? "";

  it("resolves the tile templates to their real subdomain hosts", () => {
    expect(tileHost(DEFAULT_LEAFLET_TILE.url)).toBe("a.tile.openstreetmap.org");
    expect(tileHost(DARK_LEAFLET_TILE.url)).toBe("a.basemaps.cartocdn.com");
  });

  it.each([
    ["OpenStreetMap (light)", DEFAULT_LEAFLET_TILE.url],
    ["CARTO dark", DARK_LEAFLET_TILE.url]
  ])("allows %s tiles through img-src", (_label, url) => {
    expect(cspAllows(imgSrc, tileHost(url))).toBe(true);
  });

  it("covers every tile config the loader can return", () => {
    for (const usesDark of [true, false]) {
      expect(cspAllows(imgSrc, tileHost(getLeafletTile(usesDark).url))).toBe(true);
    }
  });

  it("covers the subdomains Leaflet may substitute for {s}", () => {
    for (const sub of ["a", "b", "c"]) {
      expect(cspAllows(imgSrc, `${sub}.tile.openstreetmap.org`)).toBe(true);
      expect(cspAllows(imgSrc, `${sub}.basemaps.cartocdn.com`)).toBe(true);
    }
  });

  it("still blocks arbitrary third-party image hosts", () => {
    expect(cspAllows(imgSrc, "evil.example.com")).toBe(false);
    expect(cspAllows(imgSrc, "tile.openstreetmap.org.evil.example.com")).toBe(false);
    expect(cspAllows(imgSrc, "evil-tile.openstreetmap.org")).toBe(false);
  });
});

describe("buildCsp", () => {
  it("allows eval only outside production", () => {
    expect(buildCsp("n", true)).toContain("'unsafe-eval'");
    expect(buildCsp("n", false)).not.toContain("'unsafe-eval'");
  });

  it("binds scripts to the generated nonce", () => {
    expect(buildCsp("abc123", true)).toContain("script-src 'self' 'nonce-abc123'");
  });

  it("keeps the strict defaults", () => {
    const csp = buildCsp("n", false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("permits the weather and upload endpoints over connect-src", () => {
    const connectSrc = buildCsp("n", false).split("; ").find((d) => d.startsWith("connect-src")) ?? "";
    expect(cspAllows(connectSrc, "api.open-meteo.com")).toBe(true);
    expect(cspAllows(connectSrc, "api.cloudinary.com")).toBe(true);
  });
});
