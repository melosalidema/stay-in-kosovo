import type { PlaceDTO } from "@/types";

export const ALL_KOSOVO_CITY = "ALL_KOSOVO";

export type InvalidPlaceCityRecord = {
  id: string;
  title: string;
  reason: "missing_city";
};

export function normalizeCity(city?: string | null) {
  return city?.trim() ?? "";
}

export function getPlaceCityOptions(locationPlaces: PlaceDTO[]) {
  const seen = new Set<string>();
  const cities: string[] = [];

  for (const place of locationPlaces) {
    const city = normalizeCity(place.city);
    const key = city.toLowerCase();

    if (!city || seen.has(key)) continue;

    seen.add(key);
    cities.push(city);
  }

  return cities;
}

export function placeMatchesCity(place: PlaceDTO | undefined, city: string) {
  if (!place) return false;
  if (!city || city === ALL_KOSOVO_CITY) return true;

  return normalizeCity(place.city).toLowerCase() === city.toLowerCase();
}

export function filterPlacesByCity(locationPlaces: PlaceDTO[], city: string) {
  if (!city || city === ALL_KOSOVO_CITY) return locationPlaces;

  return locationPlaces.filter((place) => placeMatchesCity(place, city));
}

export function validatePlaceCityAssignments(locationPlaces: PlaceDTO[]) {
  return locationPlaces.reduce<InvalidPlaceCityRecord[]>((records, place) => {
    if (!normalizeCity(place.city)) {
      records.push({
        id: place.id,
        title: place.title,
        reason: "missing_city"
      });
    }

    return records;
  }, []);
}
