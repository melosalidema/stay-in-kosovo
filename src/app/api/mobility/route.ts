import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { mobilitySchema } from "@/lib/validation";
import { calculateMobilityOptionsWithGoogleRoutes, getNearbyTransportPoints } from "@/services/mobility-engine";

export const POST = withApiTiming("POST /api/mobility", async function POST(request: Request) {
  const limited = await rateLimit(getClientKey(request, "mobility"), 60, 60_000);

  if (!limited.allowed) {
    return fail("Mobility rate limit reached.", 429);
  }

  const parsed = await validateBody(request, mobilitySchema, "Invalid mobility request.");

  if (!parsed.ok) return parsed.error;

  return ok({
    options: await timeStep("mobility.calculate", () => calculateMobilityOptionsWithGoogleRoutes(parsed.data)),
    nearbyTransportPoints: await timeStep("mobility.transportPoints", () => getNearbyTransportPoints(parsed.data.city)),
    engine: {
      routeCalculation: "Google Routes API road geometry with simulated Kosovo mobility fallback.",
      mapIntegration: "Each option returns road-following route points and an encoded polyline for Google Maps rendering."
    }
  });
});