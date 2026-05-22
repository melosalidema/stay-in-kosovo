import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getAdminMetrics } from "@/services/analytics-service";

export const GET = withApiTiming("GET /api/admin/moderation", async function GET() {
  const session = await timeStep("auth.requireRole", () => requireRole(["ADMIN"]));

  if (!session) {
    return fail("Admin role required.", 403);
  }

  return ok({
    metrics: await timeStep("metrics.admin", () => getAdminMetrics()),
    queues: {
      businesses: [
        { id: "biz-queue-1", name: "Rugova Zipline Tours", city: "Peja", status: "PENDING" },
        { id: "biz-queue-2", name: "Old Bazaar Coffee", city: "Gjakova", status: "PENDING" }
      ],
      reviews: [
        { id: "rev-queue-1", place: "Hatch Prizren", risk: "Possible promotional wording" },
        { id: "rev-queue-2", place: "Brezovica", risk: "Needs photo moderation" }
      ],
      locations: [
        { id: "loc-queue-1", title: "Mirusha Waterfalls Trailhead", confidence: 0.87 }
      ]
    }
  });
});
