import { describe, expect, it } from "vitest";

import { places } from "@/data/kosovo-data";
import { googleMapsRouteUrl, isCoordinateInsideKosovo, validatePlacesForKosovoMap } from "@/lib/geo";
import { businessOnboardingSchema } from "@/lib/validation";

describe("Kosovo coordinate validation", () => {
  it("accepts every seeded fallback place coordinate", () => {
    const result = validatePlacesForKosovoMap(places);

    expect(result.validPlaces).toHaveLength(places.length);
    expect(result.invalidRecords).toEqual([]);
  });

  it("rejects missing, non-numeric, and out-of-country place coordinates", () => {
    const [place] = places;
    const result = validatePlacesForKosovoMap([
      { ...place, id: "missing", title: "Missing", coordinates: undefined as never },
      { ...place, id: "non-numeric", title: "Non numeric", coordinates: { lat: Number.NaN, lng: place.coordinates.lng } },
      { ...place, id: "outside", title: "Outside", coordinates: { lat: 41.3275, lng: 19.8187 } }
    ]);

    expect(result.validPlaces).toEqual([]);
    expect(result.invalidRecords.map((record) => record.reason)).toEqual([
      "missing_coordinates",
      "non_numeric_coordinates",
      "outside_kosovo"
    ]);
  });

  it("requires business onboarding coordinates to be inside Kosovo", () => {
    const validPayload = {
      name: "Coordinate Cafe",
      description: "A business with exact submitted coordinates.",
      city: "Prishtina",
      address: "Fazli Grajqevci, Prishtina",
      latitude: 42.6636,
      longitude: 21.1592,
      categorySlug: "cafes",
      vibeTags: ["Chill"]
    };

    expect(businessOnboardingSchema.safeParse(validPayload).success).toBe(true);
    expect(businessOnboardingSchema.safeParse({ ...validPayload, latitude: 41.3275, longitude: 19.8187 }).success).toBe(false);
    expect(isCoordinateInsideKosovo({ lat: validPayload.latitude, lng: validPayload.longitude })).toBe(true);
  });

  it("builds a Google Maps directions URL with encoded route waypoints", () => {
    const url = googleMapsRouteUrl({
      origin: { lat: 42.6613, lng: 21.1577 },
      destination: { lat: 42.6659, lng: 21.1627 },
      waypoints: [
        { lat: 42.6636, lng: 21.1592 },
        { lat: 42.6629, lng: 21.1655 }
      ],
      travelMode: "walking"
    });
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://www.google.com");
    expect(parsed.pathname).toBe("/maps/dir/");
    expect(parsed.searchParams.get("api")).toBe("1");
    expect(parsed.searchParams.get("origin")).toBe("42.6613,21.1577");
    expect(parsed.searchParams.get("destination")).toBe("42.6659,21.1627");
    expect(parsed.searchParams.get("waypoints")).toBe("42.6636,21.1592|42.6629,21.1655");
    expect(parsed.searchParams.get("travelmode")).toBe("walking");
  });
});
