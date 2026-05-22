import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getBusinessMetrics } from "@/services/analytics-service";

export const GET = withApiTiming("GET /api/businesses", async function GET() {
  const session = await timeStep("auth.requireRole", () => requireRole(["BUSINESS_OWNER", "ADMIN"]));

  if (!session) {
    return fail("Business dashboard access requires a business owner account.", 403);
  }

  return ok({
    profile: {
      name: "Soma Book Station",
      status: "APPROVED",
      visibility: "Boosted in Chill, Local Food, and Hidden Gems",
      owner: session.user.email
    },
    metrics: await timeStep("metrics.business", () => getBusinessMetrics()),
    boostSystem: {
      score: 74,
      contributors: ["Complete profile", "High review quality", "Recent events", "Fast route response"]
    }
  });
});
