import { fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { mobilitySchema } from "@/lib/validation";
import { calculateMobilityOptionsWithGoogleRoutes, getNearbyTransportPoints } from "@/services/mobility-engine";

export const POST = withApiTiming("POST /api/mobility", async function POST(request: Request) {
  const limited = rateLimit(getClientKey(request, "mobility"), 60, 60_000);

  if (!limited.allowed) {
    return fail("Mobility rate limit reached.", 429);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => mobilitySchema.safeParse(body));

  if (!parsed.success) {
    return fail("Invalid mobility request.", 422, parsed.error.flatten());
  }

  return ok({
    options: await timeStep("mobility.calculate", () => calculateMobilityOptionsWithGoogleRoutes(parsed.data)),
    nearbyTransportPoints: await timeStep("mobility.transportPoints", () => getNearbyTransportPoints(parsed.data.city)),
    engine: {
      routeCalculation: "Google Routes API road geometry with simulated Kosovo mobility fallback.",
      mapIntegration: "Each option returns road-following route points and an encoded polyline for Google Maps rendering."
    }
  });
});
