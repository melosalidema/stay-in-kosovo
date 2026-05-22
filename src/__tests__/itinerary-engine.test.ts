import { describe, expect, it } from "vitest";

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
  });
});
