import type { PlaceDTO } from "@/types";

export const ALL_KOSOVO_CITY = "ALL_KOSOVO";
export const UNKNOWN_CITY_LABEL = "Unknown city";

export function normalizeCity(city?: string | null) {
  return city?.trim() ?? "";
}

export function getMobilityCityOptions(locationPlaces: PlaceDTO[]) {
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

export function placeMatchesMobilityCity(place: PlaceDTO | undefined, city: string) {
  if (!place) return false;
  if (city === ALL_KOSOVO_CITY) return true;

  return normalizeCity(place.city).toLowerCase() === city.toLowerCase();
}

export function filterMobilityPlacesByCity(locationPlaces: PlaceDTO[], city: string) {
  if (city === ALL_KOSOVO_CITY) return locationPlaces;

  return locationPlaces.filter((place) => placeMatchesMobilityCity(place, city));
}

export function findMobilityPlaceById(locationPlaces: PlaceDTO[], id: string) {
  return locationPlaces.find((place) => place.id === id);
}

export function formatMobilityPlaceLabel(place: PlaceDTO, unknownCityLabel = UNKNOWN_CITY_LABEL) {
  const city = normalizeCity(place.city) || unknownCityLabel;
  const category = place.category?.name?.trim() || "Place";

  return `${place.title} (${city}) - ${category}`;
}
