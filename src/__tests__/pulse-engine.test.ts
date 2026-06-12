import { describe, expect, it } from "vitest";

import { places } from "@/data/kosovo-data";
import { ALL_KOSOVO_CITY } from "@/lib/place-options";
import { generateExperiencePulse } from "@/services/pulse-engine";

describe("pulse engine", () => {
  it("creates city demand zones and supply-gap recommendations", () => {
    const pulse = generateExperiencePulse({
      city: "Prishtina",
      vibe: "Nightlife",
      dayPart: "EVENING"
    });

    expect(pulse.city).toBe("Prishtina");
    expect(pulse.liveScore).toBeGreaterThan(0);
    expect(pulse.zones.length).toBeGreaterThan(0);
    expect(pulse.topVibes.length).toBeGreaterThan(0);
    expect(pulse.methodology.join(" ")).toContain("business boost");
  });

  it("supports an All Kosovo national pulse overview", () => {
    const pulse = generateExperiencePulse({
      city: ALL_KOSOVO_CITY,
      vibe: "Nightlife",
      dayPart: "EVENING"
    });
    const datasetCities = new Set(places.map((place) => place.city));
    const pulseCities = new Set(pulse.zones.map((zone) => zone.city));

    expect(pulse.city).toBe("All Kosovo");
    expect(pulse.liveScore).toBeGreaterThan(0);
    expect(pulse.transportHealth.averageReliability).toBeGreaterThan(0);
    expect([...pulseCities].some((city) => datasetCities.has(city))).toBe(true);
  });
});
