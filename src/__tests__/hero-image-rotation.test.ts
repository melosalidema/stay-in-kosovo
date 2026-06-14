import { describe, expect, it } from "vitest";

import { buildHeroImageRotation, fallbackHeroImage } from "@/components/home/hero-image-rotation";
import { events, places } from "@/data/kosovo-data";

describe("buildHeroImageRotation", () => {
  it("builds a deduped hero rotation from all place and event images", () => {
    const rotation = buildHeroImageRotation([...places, ...events]);
    const uniqueSources = new Set(rotation.map((image) => image.src));

    expect(rotation.length).toBeGreaterThan(1);
    expect(rotation).toHaveLength(uniqueSources.size);
    expect(rotation.some((image) => image.label === events[0].title)).toBe(true);
    expect(rotation.every((image) => image.src.startsWith("https://"))).toBe(true);
    expect(rotation.some((image) => image.src.includes("upload.wikimedia.org") || image.src.includes("images.weserv.nl"))).toBe(true);
  });

  it("falls back safely when no source images exist", () => {
    expect(buildHeroImageRotation([])).toEqual([{ src: fallbackHeroImage, label: "Kosovo", city: "" }]);
  });
});
