import { describe, expect, it } from "vitest";

import {
  ALL_KOSOVO_CITY,
  filterPlacesByCity,
  getPlaceCityOptions,
  validatePlaceCityAssignments
} from "@/lib/place-options";
import { places } from "@/data/kosovo-data";

describe("place city options", () => {
  it("builds unique city options from the real place dataset", () => {
    expect(getPlaceCityOptions(places)).toEqual([
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

  it("supports All Kosovo and city-specific filtering", () => {
    expect(filterPlacesByCity(places, ALL_KOSOVO_CITY)).toHaveLength(places.length);

    const prizrenPlaces = filterPlacesByCity(places, "Prizren");
    const datasetPrizrenPlaces = places.filter((place) => place.city === "Prizren");

    expect(prizrenPlaces).toHaveLength(datasetPrizrenPlaces.length);
    expect(prizrenPlaces.every((place) => place.city === "Prizren")).toBe(true);
    expect(prizrenPlaces.map((place) => place.slug)).toContain("prizren-fortress");
  });

  it("reports missing city assignments without breaking city options", () => {
    const placeWithoutCity = { ...places[0], id: "missing-city", city: " " };
    const records = validatePlaceCityAssignments([...places, placeWithoutCity]);

    expect(records).toEqual([{ id: "missing-city", title: "Germia Park", reason: "missing_city" }]);
    expect(getPlaceCityOptions([...places, placeWithoutCity])).toEqual(getPlaceCityOptions(places));
  });
});
