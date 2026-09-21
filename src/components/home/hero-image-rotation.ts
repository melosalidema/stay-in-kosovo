import { getPlaceImageSrc } from "@/lib/place-images";

export type HeroImageSource = {
  title: string;
  city?: string;
  images?: string[];
};

export type HeroImage = {
  src: string;
  label: string;
  city: string;
};

/** Wikimedia thumbnail width that the Commons thumbnailer will serve for this file. */
const FEATURED_HERO_WIDTH = 1280;

/**
 * Lead hero photograph: the Government of Kosovo building in Pristina.
 *
 * Source: Wikimedia Commons, "Edificio del gobierno, Pristina, Kosovo, 2014-04-16, DD 17.JPG"
 * by Diego Delso, licensed CC BY-SA 4.0.
 * https://commons.wikimedia.org/wiki/File:Edificio_del_gobierno,_Pristina,_Kosovo,_2014-04-16,_DD_17.JPG
 *
 * The original is 2347x3874 and 3.85 MB, so we request a 1280px thumbnail instead.
 */
export const FEATURED_HERO_SOURCE =
  "https://upload.wikimedia.org/wikipedia/commons/f/fe/Edificio_del_gobierno%2C_Pristina%2C_Kosovo%2C_2014-04-16%2C_DD_17.JPG";

export const FEATURED_HERO_THUMB =
  `https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/` +
  `Edificio_del_gobierno%2C_Pristina%2C_Kosovo%2C_2014-04-16%2C_DD_17.JPG/` +
  `${FEATURED_HERO_WIDTH}px-Edificio_del_gobierno%2C_Pristina%2C_Kosovo%2C_2014-04-16%2C_DD_17.JPG`;

export const featuredHeroImage: HeroImage = {
  src: FEATURED_HERO_THUMB,
  label: "Government of Kosovo",
  city: "Pristina"
};

export const fallbackHeroImage =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg/1280px-Germia_Park_during_Spring_Season_in_Prishtina%2C_Kosovo.jpg";

export function buildHeroImageRotation(sources: HeroImageSource[]): HeroImage[] {
  const seen = new Set<string>();
  const images = sources.flatMap((source) =>
    (source.images ?? [])
      .filter((src): src is string => Boolean(src))
      .map((src) => ({
        src: getPlaceImageSrc(src, 1800),
        label: source.title,
        city: source.city ?? ""
      }))
  );
  const uniqueImages = images.filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });

  return uniqueImages.length ? uniqueImages : [{ src: fallbackHeroImage, label: "Kosovo", city: "" }];
}
