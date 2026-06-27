import { fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { getWeather } from "@/services/weather-service";

const ALLOWED_CITIES = new Set(["Prishtina", "Prizren", "Peja", "Gjakova", "Brezovica", "Mitrovica", "Ferizaj", "Gjilan", "Podujeva", "Kacanik"]);

export const GET = withApiTiming("GET /api/weather", async function GET(request: Request) {
  const limited = await rateLimit(getClientKey(request, "weather"), 60, 60_000);

  if (!limited.allowed) {
    return fail("Weather rate limit reached.", 429);
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Prishtina";

  if (!ALLOWED_CITIES.has(city)) {
    return fail("Unknown city.", 400);
  }

  return ok(await timeStep("weather.get", () => getWeather(city)));
});
