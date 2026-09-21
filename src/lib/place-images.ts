import type { PlaceDTO } from "@/types";

const WIKIMEDIA_UPLOAD_HOST = "upload.wikimedia.org";
const WIKIMEDIA_IMAGE_PROXY_HOST = "images.weserv.nl";

const W = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

/**
 * Fallbacks are real Kosovo photographs rather than generic stock, so a place
 * that is missing its own image still looks like it belongs on this site.
 * All are Wikimedia Commons files under CC BY-SA / CC0 (see footer credits).
 */
const fallbackImagesByCategory: Record<string, string[]> = {
  cafes: [W("c/ca/Cafe_in_Pristina.jpg/1280px-Cafe_in_Pristina.jpg")],
  culture: [W("a/a8/NationalLibrary.jpg/1280px-NationalLibrary.jpg")],
  events: [W("f/fd/B%C3%BChne_und_VIP-Trib%C3%BCne_Sunny_Hill_Festival_.jpg/1280px-B%C3%BChne_und_VIP-Trib%C3%BCne_Sunny_Hill_Festival_.jpg")],
  hotels: [W("9/99/Pamje_para_Hotel_Grandit.jpg/1280px-Pamje_para_Hotel_Grandit.jpg")],
  nature: [W("6/6b/Rugova_canyon_%28WPWTR17%29.jpg/1280px-Rugova_canyon_%28WPWTR17%29.jpg")],
  nightlife: [W("f/f1/Kafenete_me_ngjyra_te_Prishtines%21.jpg/1280px-Kafenete_me_ngjyra_te_Prishtines%21.jpg")],
  parks: [W("c/c0/Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg/1280px-Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg")],
  restaurants: [W("8/83/Restaurant_Liburnia_Prishtina.jpg/1280px-Restaurant_Liburnia_Prishtina.jpg")],
  shopping: [W("e/e8/Prishtina_Mall_08.jpg/1280px-Prishtina_Mall_08.jpg")]
};

const defaultPlaceImage = W(
  "c/c0/Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg/1280px-Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg"
);

/** Older records stored bare Unsplash ids; map them onto a category-appropriate Kosovo photo. */
const legacyUnsplashFallbacks: Array<[RegExp, string]> = [
  [/photo-1464822759023|photo-1500534314209|photo-1447752875215|photo-1483728642387|photo-1498855926480/, fallbackImagesByCategory.nature[0]],
  [/photo-1555396273|photo-1414235077428|photo-1504674900247/, fallbackImagesByCategory.restaurants[0]],
  [/photo-1517248135467|photo-1528605248644/, fallbackImagesByCategory.hotels[0]],
  [/photo-1523906834658|photo-1500530855697|photo-1470770841072|photo-1501785888041/, fallbackImagesByCategory.culture[0]],
  [/photo-1495474472287|photo-1509042239860/, fallbackImagesByCategory.cafes[0]],
  [/photo-1514933651103|photo-1511192336575/, fallbackImagesByCategory.nightlife[0]],
  [/photo-1492684223066|photo-1501386761578/, fallbackImagesByCategory.events[0]],
  [/photo-1441974231531/, fallbackImagesByCategory.parks[0]]
];

function fallbackForSource(src: string) {
  for (const [pattern, url] of legacyUnsplashFallbacks) {
    if (pattern.test(src)) return url;
  }

  return defaultPlaceImage;
}

export function getPlaceImageSrc(src?: string | null, width = 1200) {
  if (!src) return "";

  try {
    const url = new URL(src);

    if (url.hostname === "source.unsplash.com") {
      return fallbackForSource(src);
    }

    if (url.hostname === "images.unsplash.com") {
      return fallbackForSource(src);
    }

    if (url.hostname === WIKIMEDIA_UPLOAD_HOST) {
      return url.href;
    }

    void width;
  } catch {
    return src;
  }

  return src;
}

export function getDefaultPlaceImageSrc() {
  return defaultPlaceImage;
}

export function getPlaceImageCandidates(place: PlaceDTO, width = 1200) {
  void width;
  const candidates = [
    ...place.images.map((src) => getPlaceImageSrc(src)),
    ...(fallbackImagesByCategory[place.category.slug] ?? []),
    defaultPlaceImage
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

export function shouldBypassNextImageOptimization(src?: string | null) {
  if (!src) return false;

  try {
    const hostname = new URL(src).hostname;

    // These hosts serve originals we cannot resize through our loader.
    return hostname === WIKIMEDIA_IMAGE_PROXY_HOST || hostname === WIKIMEDIA_UPLOAD_HOST;
  } catch {
    return false;
  }
}

type ImageLoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

const UNSPLASH_HOST = "images.unsplash.com";

export function placeImageLoader({ src, width, quality }: ImageLoaderArgs): string {
  try {
    const url = new URL(src);

    if (url.hostname === UNSPLASH_HOST) {
      const targetWidth = Math.min(width, 1920);
      url.searchParams.set("w", String(targetWidth));
      url.searchParams.set("q", String(quality ?? 80));
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      return url.href;
    }
  } catch {
    // src is not a valid URL — fall through to return as-is
  }

  return src;
}
