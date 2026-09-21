import { describe, expect, it } from "vitest";

import { buildHeroImageRotation, fallbackHeroImage } from "@/components/home/hero-image-rotation";
import { events, places } from "@/data/kosovo-data";

const PRIZREN_FORTRESS =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Prizren_Fortress_%282021%29.jpg";

describe("buildHeroImageRotation", () => {
  it("builds a deduped hero rotation from all place and event images", () => {
    const rotation = buildHeroImageRotation([...places, ...events]);
    const uniqueSources = new Set(rotation.map((image) => image.src));

    expect(rotation.length).toBeGreaterThan(1);
    expect(rotation).toHaveLength(uniqueSources.size);
    expect(rotation.every((image) => image.src.startsWith("https://"))).toBe(true);
    expect(
      rotation.some(
        (image) => image.src.includes("upload.wikimedia.org") || image.src.includes("images.weserv.nl")
      )
    ).toBe(true);
  });

  it("keeps a shared photograph only once, so an event reuses its venue's image", () => {
    const rotation = buildHeroImageRotation([
      { title: "Prizren Fortress", city: "Prizren", images: [PRIZREN_FORTRESS] },
      { title: "Sunset Story Walk", city: "Prizren", images: [PRIZREN_FORTRESS] }
    ]);

    expect(rotation).toHaveLength(1);
    expect(rotation[0].label).toBe("Prizren Fortress");
  });

  it("ignores empty image entries", () => {
    const rotation = buildHeroImageRotation([
      { title: "No photos here", city: "Peja", images: ["", undefined as unknown as string] }
    ]);

    expect(rotation).toEqual([{ src: fallbackHeroImage, label: "Kosovo", city: "" }]);
  });

  it("falls back safely when no source images exist", () => {
    expect(buildHeroImageRotation([])).toEqual([{ src: fallbackHeroImage, label: "Kosovo", city: "" }]);
  });
});
