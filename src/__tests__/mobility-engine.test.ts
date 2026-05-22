import { describe, expect, it } from "vitest";

import { calculateMobilityOptions, distanceKm } from "@/services/mobility-engine";

describe("mobility engine", () => {
  it("calculates positive distance and route options", () => {
    const from = { lat: 42.6613, lng: 21.1577 };
    const to = { lat: 42.6636, lng: 21.1592 };

    expect(distanceKm(from, to)).toBeGreaterThan(0);

    const options = calculateMobilityOptions({ from, to, preference: "WALKING", city: "Prishtina" });

    expect(options).toHaveLength(5);
    expect(options[0].method).toBe("WALKING");
    expect(options[0].durationMinutes).toBeGreaterThan(0);
    expect(options[0].routePoints).toHaveLength(3);
  });
});
