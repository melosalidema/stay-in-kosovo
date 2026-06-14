import { describe, expect, it } from "vitest";

import { buildFallbackHomepageLocationLayer, buildLocationLayer } from "@/services/location-layer";
import type { PlaceDTO } from "@/types";

const category = {
  id: "cat-test",
  name: "Restaurants",
  slug: "restaurants",
  type: "FOOD",
  icon: "Utensils"
} as const;

function place(overrides: Partial<PlaceDTO> = {}): PlaceDTO {
  return {
    id: "place-test",
    title: "Test Place",
    slug: "test-place",
    description: "A test place in Kosovo.",
    city: "Prishtina",
    address: "Fazli Grajqevci, Prishtina",
    category,
    coordinates: { lat: 42.6636, lng: 21.1592 },
    priceLevel: 2,
    rating: 4.5,
    reviewCount: 10,
    avgStayMinutes: 60,
    openNow: true,
    vibeTags: ["Local Food"],
    atmosphereTags: ["local"],
    images: [],
    transportation: {
      walkingFriendly: true,
      taxiMinutes: 5,
      busAvailable: true
    },
    popularityScore: 70,
    hiddenGemScore: 50,
    ...overrides
  };
}

describe("buildLocationLayer", () => {
  it("keeps valid stored coordinates", () => {
    const [result] = buildLocationLayer([place()]);

    expect(result.coordinates).toEqual({ lat: 42.6636, lng: 21.1592 });
  });

  it("resolves missing coordinates from address and city", () => {
    const [result] = buildLocationLayer([
      {
        ...place({
          id: "place-without-coordinates",
          slug: "place-without-coordinates"
        }),
        coordinates: null
      }
    ]);

    expect(result.coordinates).toEqual({ lat: 42.6638, lng: 21.159 });
  });

  it("deduplicates places by slug", () => {
    const results = buildLocationLayer([
      place({ id: "first", slug: "same-place" }),
      place({ id: "second", slug: "same-place" })
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("first");
  });

  it("adds linked events to the homepage location layer", () => {
    const results = buildFallbackHomepageLocationLayer();

    expect(results.some((item) => item.id.startsWith("event-") && item.category.slug === "events")).toBe(true);
  });
});
