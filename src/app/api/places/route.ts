import { cacheHeaders, fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { placeFilterSchema } from "@/lib/validation";
import { getPlaces } from "@/services/place-service";

export const GET = withApiTiming("GET /api/places", async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = await timeStep("validate", () => placeFilterSchema.safeParse(Object.fromEntries(searchParams.entries())));

  if (!parsed.success) {
    return fail("Invalid place filters.", 422, parsed.error.flatten());
  }

  const data = await timeStep("places.get", () => getPlaces(parsed.data));

  return ok(
    {
      places: data,
      filters: parsed.data,
      total: data.length
    },
    { headers: cacheHeaders(45) }
  );
});
