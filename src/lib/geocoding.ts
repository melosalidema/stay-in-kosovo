import { isCoordinateInsideKosovo } from "@/lib/geo";
import type { Coordinates } from "@/types";

export type KosovoGeocodeInput = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
};

const cityCoordinates: Record<string, Coordinates> = {
  brezovica: { lat: 42.2208, lng: 21.0075 },
  gjakova: { lat: 42.3803, lng: 20.4308 },
  peja: { lat: 42.6591, lng: 20.2883 },
  prishtina: { lat: 42.6629, lng: 21.1655 },
  prizren: { lat: 42.2097, lng: 20.7397 }
};

const addressCoordinateOverrides: Record<string, Coordinates> = {
  "berni park prishtina": { lat: 42.6424, lng: 21.1272 },
  "fazli grajqevci prishtina": { lat: 42.6638, lng: 21.159 },
  "germia prishtina": { lat: 42.6762, lng: 21.2041 },
  "grand bazaar gjakova": { lat: 42.3801, lng: 20.4277 },
  "kalaja prizren": { lat: 42.2081, lng: 20.7425 },
  "luan haradinaj prishtina": { lat: 42.6613, lng: 21.1577 },
  "metush krasniqi prishtina": { lat: 42.6659, lng: 21.1627 },
  "mirusha park trailhead": { lat: 42.5242, lng: 20.6089 },
  "old bazaar peja": { lat: 42.6596, lng: 20.2889 },
  "rugova valley peja": { lat: 42.6901, lng: 20.1783 },
  "shadervan prizren": { lat: 42.2102, lng: 20.7399 },
  "sharr mountains brezovica": { lat: 42.2208, lng: 21.0075 }
};

const geocodeCache = new Map<string, Coordinates | null>();

function normalizeGeocodeToken(value?: string | null) {
  return value
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase() ?? "";
}

function cacheKey(input: KosovoGeocodeInput) {
  return [input.name, input.address, input.city].map(normalizeGeocodeToken).join("|");
}

function validOrNull(coordinates: Coordinates | undefined) {
  return coordinates && isCoordinateInsideKosovo(coordinates) ? coordinates : null;
}

export function geocodeKosovoLocation(input: KosovoGeocodeInput): Coordinates | null {
  const key = cacheKey(input);
  const cached = geocodeCache.get(key);

  if (cached !== undefined) return cached;

  const address = normalizeGeocodeToken(input.address);
  const city = normalizeGeocodeToken(input.city);
  const candidates = [
    address,
    city && address ? `${address} ${city}` : "",
    normalizeGeocodeToken(input.name),
    city
  ].filter(Boolean);

  for (const candidate of candidates) {
    const addressMatch = validOrNull(addressCoordinateOverrides[candidate]);

    if (addressMatch) {
      geocodeCache.set(key, addressMatch);
      return addressMatch;
    }
  }

  const cityMatch = validOrNull(cityCoordinates[city]);
  geocodeCache.set(key, cityMatch);

  return cityMatch;
}

export function getKosovoCityCoordinates(city?: string | null) {
  return validOrNull(cityCoordinates[normalizeGeocodeToken(city)]);
}
