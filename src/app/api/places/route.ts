import { cacheHeaders, ok } from "@/lib/api-response";
import { validateQuery } from "@/lib/api-validate";
import { timeStep, withApiTiming } from "@/lib/performance";
import { placeFilterSchema } from "@/lib/validation";
import { getPlaces } from "@/services/place-service";

export const GET = withApiTiming("GET /api/places", async function GET(request: Request) {
  const parsed = await validateQuery(request, placeFilterSchema, "Invalid place filters.");

  if (!parsed.ok) return parsed.error;

  const { places, cursor, hasMore } = await timeStep("places.get", () => getPlaces(parsed.data));

  return ok(
    {
      places,
      filters: parsed.data,
      total: places.length,
      cursor,
      hasMore
    },
    { headers: cacheHeaders(45) }
  );
});
