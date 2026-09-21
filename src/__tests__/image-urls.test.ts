import { describe, expect, it } from "vitest";

import { events, places } from "@/data/kosovo-data";
import { getPlaceImageCandidates, getPlaceImageSrc } from "@/lib/place-images";

/**
 * A Commons thumbnail URL must carry a width segment:
 *   /commons/thumb/<a>/<ab>/<Name.ext>/<WIDTH>px-<Name.ext>
 * Without it the thumbnailer answers HTTP 400 and the card shows a broken
 * image. This has regressed once, so it is asserted here.
 */
const WIKIMEDIA_THUMB = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+/;

function assertWellFormedThumb(url: string, source: string) {
  if (!WIKIMEDIA_THUMB.test(url)) return;

  const segments = url.split("/");
  const last = segments[segments.length - 1];
  const filename = segments[segments.length - 2];

  expect(
    /^\d+px-/.test(last),
    `Malformed Commons thumbnail in ${source}:\n  ${url}\n  expected ".../${filename}/1280px-${filename}"`
  ).toBe(true);
}

describe("place and event image URLs", () => {
  it("uses only https sources", () => {
    for (const place of places) {
      for (const image of place.images) {
        expect(image.startsWith("https://"), `${place.title}: ${image}`).toBe(true);
      }
    }
    for (const event of events) {
      for (const image of event.images) {
        expect(image.startsWith("https://"), `${event.title}: ${image}`).toBe(true);
      }
    }
  });

  it("never stores a Commons thumbnail without a width segment", () => {
    for (const place of places) {
      for (const image of place.images) assertWellFormedThumb(image, place.title);
    }
    for (const event of events) {
      for (const image of event.images) assertWellFormedThumb(image, event.title);
    }
  });

  it("resolves every place to at least one candidate image", () => {
    for (const place of places) {
      const candidates = getPlaceImageCandidates(place);
      expect(candidates.length, place.title).toBeGreaterThan(0);
      expect(candidates[0].startsWith("https://"), place.title).toBe(true);
    }
  });

  it("rewrites legacy Unsplash ids onto real Kosovo photography", () => {
    const legacy = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200";
    const rewritten = getPlaceImageSrc(legacy);

    expect(rewritten).not.toContain("images.unsplash.com");
    expect(rewritten.startsWith("https://upload.wikimedia.org/")).toBe(true);
    assertWellFormedThumb(rewritten, "getPlaceImageSrc fallback");
  });

  it("passes through an already-valid Commons URL unchanged", () => {
    const valid =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/KosovoMirusha.jpg/1280px-KosovoMirusha.jpg";
    expect(getPlaceImageSrc(valid)).toBe(valid);
  });
});
