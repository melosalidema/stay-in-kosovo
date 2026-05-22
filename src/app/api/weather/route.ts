import { ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getWeather } from "@/services/weather-service";

export const GET = withApiTiming("GET /api/weather", async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Prishtina";

  return ok(await timeStep("weather.get", () => getWeather(city)));
});
