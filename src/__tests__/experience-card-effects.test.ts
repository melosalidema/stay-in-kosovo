import { describe, expect, it } from "vitest";

import { pulseIntensityTone } from "@/components/ui/experience-card-effects";

describe("experience card pulse intensity colors", () => {
  it("maps pulse intensity to green, orange, and red thresholds", () => {
    expect(pulseIntensityTone(69)).toBe("green");
    expect(pulseIntensityTone(70)).toBe("amber");
    expect(pulseIntensityTone(89)).toBe("amber");
    expect(pulseIntensityTone(90)).toBe("rose");
  });
});
