import { describe, expect, it } from "vitest";

import { places } from "@/data/kosovo-data";
import { generateItinerary } from "@/services/itinerary-engine";

describe("itinerary engine", () => {
  it("generates a timed route with costs and stops", () => {
    const itinerary = generateItinerary({
      city: "Prishtina",
      budget: 80,
      durationHours: 5,
      interests: ["food", "culture"],
      vibe: "Local Food",
      transportPreference: "WALKING"
    });

    expect(itinerary.city).toBe("Prishtina");
    expect(itinerary.stops.length).toBeGreaterThanOrEqual(2);
    expect(itinerary.totalCost).toBeLessThanOrEqual(80);
    expect(itinerary.stops[0].startTime).toMatch(/\d{2}:\d{2}/);
    expect(itinerary.plannedMinutes).toBeGreaterThanOrEqual(5 * 60);
  });

  it("fills the selected duration for every city in the dataset", () => {
    const cities = Array.from(new Set(places.map((place) => place.city)));

    for (const city of cities) {
      const itinerary = generateItinerary({
        city,
        budget: 180,
        durationHours: 8,
        interests: ["food", "culture", "nature"],
        vibe: "Culture",
        transportPreference: "CAR"
      });

      expect(itinerary.stops.length, city).toBeGreaterThan(0);
      expect(itinerary.plannedMinutes, city).toBeGreaterThanOrEqual(itinerary.durationHours * 60);
      expect(itinerary.stops.some((stop) => stop.place.city === city), city).toBe(true);
    }
  });

  it("supports multi-day itineraries with day metadata", () => {
    const itinerary = generateItinerary({
      city: "Kacanik",
      budget: 400,
      durationHours: 16,
      durationDays: 2,
      interests: ["nature", "culture", "food"],
      vibe: "Adventure & Trails",
      transportPreference: "CAR"
    });

    expect(itinerary.durationDays).toBe(2);
    expect(itinerary.durationHours).toBe(16);
    expect(itinerary.plannedMinutes).toBeGreaterThanOrEqual(16 * 60);
    expect(new Set(itinerary.stops.map((stop) => stop.day))).toEqual(new Set([1, 2]));
    expect(new Set(itinerary.stops.map((stop) => stop.place.id)).size).toBe(itinerary.stops.length);
  });
});
