import { describe, expect, it } from "vitest";

import { places } from "@/data/kosovo-data";
import { recommendPlaces } from "@/services/recommendation-engine";

describe("recommendPlaces", () => {
  it("prioritizes places that match the selected vibe", () => {
    const results = recommendPlaces({
      vibes: ["Adventure"],
      city: "Peja",
      budget: 3,
      transportPreference: "CAR"
    });

    expect(results[0].place.slug).toBe("rugova-canyon");
    expect(results[0].score).toBeGreaterThan(70);
    expect(results[0].reasons.join(" ")).toContain("Adventure");
  });

  it("respects city and open-now filters", () => {
    const results = recommendPlaces(
      {
        vibes: ["Local Food"],
        city: "Prishtina",
        openNow: true,
        limit: 10
      },
      places
    );

    expect(results.every((item) => item.place.city === "Prishtina")).toBe(true);
    expect(results.every((item) => item.place.openNow)).toBe(true);
  });
});
