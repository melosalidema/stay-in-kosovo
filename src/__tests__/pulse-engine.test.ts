import { describe, expect, it } from "vitest";

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
});
