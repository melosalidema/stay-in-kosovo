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

export const fallbackHeroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80";

export function buildHeroImageRotation(sources: HeroImageSource[]): HeroImage[] {
  const seen = new Set<string>();
  const images = sources.flatMap((source) =>
    (source.images ?? [])
      .filter((src): src is string => Boolean(src))
      .map((src) => ({
        src,
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
