import { fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getPlaceBySlugOrId } from "@/services/place-service";

export const GET = withApiTiming("GET /api/places/:id", async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const place = await timeStep("places.getById", () => getPlaceBySlugOrId(id));

  if (!place) {
    return fail("Place not found.", 404);
  }

  return ok(place);
});
