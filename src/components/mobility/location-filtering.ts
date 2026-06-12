import type { PlaceDTO } from "@/types";
import {
  ALL_KOSOVO_CITY,
  filterPlacesByCity,
  getPlaceCityOptions,
  normalizeCity,
  placeMatchesCity
} from "@/lib/place-options";

export const UNKNOWN_CITY_LABEL = "Unknown city";

export function getMobilityCityOptions(locationPlaces: PlaceDTO[]) {
  return getPlaceCityOptions(locationPlaces);
}

export function placeMatchesMobilityCity(place: PlaceDTO | undefined, city: string) {
  return placeMatchesCity(place, city);
}

export function filterMobilityPlacesByCity(locationPlaces: PlaceDTO[], city: string) {
  return filterPlacesByCity(locationPlaces, city);
}

export function findMobilityPlaceById(locationPlaces: PlaceDTO[], id: string) {
  return locationPlaces.find((place) => place.id === id);
}

export function formatMobilityPlaceLabel(place: PlaceDTO, unknownCityLabel = UNKNOWN_CITY_LABEL) {
  const city = normalizeCity(place.city) || unknownCityLabel;
  const category = place.category?.name?.trim() || "Place";

  return `${place.title} (${city}) - ${category}`;
}

export { ALL_KOSOVO_CITY, normalizeCity };
