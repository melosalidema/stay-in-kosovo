import { describe, expect, it } from "vitest";

import {
  ALL_KOSOVO_CITY,
  filterMobilityPlacesByCity,
  formatMobilityPlaceLabel,
  getMobilityCityOptions
} from "@/components/mobility/location-filtering";
import { places } from "@/data/kosovo-data";

describe("mobility location filtering", () => {
  it("builds city options from the place dataset in source order", () => {
    expect(getMobilityCityOptions(places)).toEqual([
      "Prishtina",
      "Prizren",
      "Peja",
      "Brezovica",
      "Gjakova",
      "Gjilan",
      "Ferizaj",
      "Podujeva",
      "Mitrovica",
      "Kacanik"
    ]);
  });

  it("filters from and to locations to the selected city", () => {
    const prishtinaPlaces = filterMobilityPlacesByCity(places, "Prishtina");

    expect(prishtinaPlaces.length).toBeGreaterThan(0);
    expect(prishtinaPlaces.every((place) => place.city === "Prishtina")).toBe(true);
    expect(prishtinaPlaces.some((place) => place.slug === "newborn-monument")).toBe(true);
    expect(prishtinaPlaces.some((place) => place.slug === "prizren-fortress")).toBe(false);
    expect(prishtinaPlaces.some((place) => place.slug === "rugova-canyon")).toBe(false);
  });

  it("keeps the current all-Kosovo behavior when requested", () => {
    expect(filterMobilityPlacesByCity(places, ALL_KOSOVO_CITY)).toHaveLength(places.length);
  });

  it("handles records with missing city values without breaking labels or city options", () => {
    const placeWithoutCity = { ...places[0], id: "missing-city", city: " " };
    const mixedPlaces = [...places, placeWithoutCity];

    expect(getMobilityCityOptions(mixedPlaces)).toEqual(getMobilityCityOptions(places));
    expect(filterMobilityPlacesByCity(mixedPlaces, "Prishtina")).not.toContain(placeWithoutCity);
    expect(formatMobilityPlaceLabel(placeWithoutCity)).toBe("Germia Park (Unknown city) - Parks");
  });
});
