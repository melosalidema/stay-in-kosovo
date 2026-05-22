import type { Coordinates } from "@/types";

const cityCoordinates: Record<string, Coordinates> = {
  Prishtina: { lat: 42.6629, lng: 21.1655 },
  Prizren: { lat: 42.2097, lng: 20.7397 },
  Peja: { lat: 42.6591, lng: 20.2883 },
  Gjakova: { lat: 42.3803, lng: 20.4308 },
  Brezovica: { lat: 42.2208, lng: 21.0075 }
};

type WeatherPayload = {
  city: string;
  temperature: number;
  windKph: number;
  code: number;
  summary: string;
};

const weatherCache = new Map<string, { expiresAt: number; data: WeatherPayload }>();
const weatherInFlight = new Map<string, Promise<WeatherPayload>>();
const weatherTtlMs = 15 * 60_000;
const weatherTimeoutMs = Number(process.env.WEATHER_TIMEOUT_MS ?? 1500);

export async function getWeather(city = "Prishtina") {
  const cached = weatherCache.get(city);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const inFlight = weatherInFlight.get(city);
  if (inFlight) return inFlight;

  const loadWeather = fetchWeather(city);
  weatherInFlight.set(city, loadWeather);

  try {
    return await loadWeather;
  } finally {
    weatherInFlight.delete(city);
  }
}

async function fetchWeather(city: string): Promise<WeatherPayload> {
  const coordinates = cityCoordinates[city] ?? cityCoordinates.Prishtina;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coordinates.lat));
  url.searchParams.set("longitude", String(coordinates.lng));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "Europe/Berlin");

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(weatherTimeoutMs)
    });

    if (!response.ok) {
      throw new Error("Weather provider failed");
    }

    const data = await response.json();

    const weather = {
      city,
      temperature: Math.round(data.current.temperature_2m),
      windKph: Math.round(data.current.wind_speed_10m),
      code: data.current.weather_code,
      summary: data.current.weather_code > 60 ? "Rain possible" : "Good exploring weather"
    };

    weatherCache.set(city, { expiresAt: Date.now() + weatherTtlMs, data: weather });

    return weather;
  } catch {
    const fallback = {
      city,
      temperature: 22,
      windKph: 8,
      code: 1,
      summary: "Weather fallback active"
    };

    weatherCache.set(city, { expiresAt: Date.now() + Math.min(weatherTtlMs, 60_000), data: fallback });

    return fallback;
  }
}
