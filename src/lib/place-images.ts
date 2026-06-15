import type { PlaceDTO } from "@/types";

const WIKIMEDIA_UPLOAD_HOST = "upload.wikimedia.org";
const WIKIMEDIA_IMAGE_PROXY_HOST = "images.weserv.nl";

const image = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const defaultPlaceImageId = "photo-1500530855697-b586d89ba3ee";

const fallbackImageIdsByCategory: Record<string, string[]> = {
  cafes: ["photo-1495474472287-4d71bcdd2085", "photo-1509042239860-f550ce710b93"],
  culture: ["photo-1523906834658-6e24ef2386f9", "photo-1500530855697-b586d89ba3ee"],
  events: ["photo-1492684223066-81342ee5ff30", "photo-1501386761578-eac5c94b800a"],
  hotels: ["photo-1517248135467-4c7edcad34c4", "photo-1528605248644-14dd04022da1"],
  nature: ["photo-1464822759023-fed622ff2c3b", "photo-1500534314209-a25ddb2bd429"],
  nightlife: ["photo-1514933651103-005eec06c04b", "photo-1528605248644-14dd04022da1"],
  parks: ["photo-1441974231531-c6227db76b6e", "photo-1500534314209-a25ddb2bd429"],
  restaurants: ["photo-1555396273-367ea4eb4db5", "photo-1414235077428-338989a2e8c0"],
  shopping: ["photo-1523906834658-6e24ef2386f9", "photo-1504674900247-0877df9cc836"]
};

const fallbackImageIdsByKeyword: Array<[RegExp, string]> = [
  [/mountain|canyon|waterfall|lake|cave|ferrata|hill|park|forest|nature/i, "photo-1464822759023-fed622ff2c3b"],
  [/restaurant|food|grill|dinner|lakeside/i, "photo-1555396273-367ea4eb4db5"],
  [/hotel|boutique|luxury/i, "photo-1517248135467-4c7edcad34c4"],
  [/bazaar|craft|old.town|stone|bridge|museum|mosque|church|monastery|tower|hammam|ottoman|memorial|library|cathedral/i, "photo-1523906834658-6e24ef2386f9"],
  [/shopping|mall/i, "photo-1504674900247-0877df9cc836"]
];

function getFallbackImageForSource(src: string, width: number) {
  for (const [pattern, imageId] of fallbackImageIdsByKeyword) {
    if (pattern.test(src)) {
      return image(imageId, width);
    }
  }

  return image(defaultPlaceImageId, width);
}

export function getPlaceImageSrc(src?: string | null, width = 1200) {
  if (!src) return "";

  try {
    const url = new URL(src);

    if (url.hostname === "source.unsplash.com") {
      return getFallbackImageForSource(src, width);
    }

    if (url.hostname === WIKIMEDIA_UPLOAD_HOST) {
      return url.href;
    }
  } catch {
    return src;
  }

  return src;
}

export function getDefaultPlaceImageSrc(width = 1200) {
  return image(defaultPlaceImageId, width);
}

export function getPlaceImageCandidates(place: PlaceDTO, width = 1200) {
  const candidates = [
    ...place.images.map((src) => getPlaceImageSrc(src, width)),
    ...(fallbackImageIdsByCategory[place.category.slug] ?? []).map((imageId) => image(imageId, width)),
    getDefaultPlaceImageSrc(width)
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

export function shouldBypassNextImageOptimization(src?: string | null) {
  if (!src) return false;

  try {
    return new URL(src).hostname === WIKIMEDIA_IMAGE_PROXY_HOST;
  } catch {
    return false;
  }
}
