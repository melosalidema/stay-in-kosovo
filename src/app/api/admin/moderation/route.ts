import { ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getAdminMetrics } from "@/services/analytics-service";

export const GET = withApiTiming("GET /api/admin/moderation", async function GET() {
  const session = await timeStep("auth.requireRole", () => requireRole(["ADMIN"], "Admin role required."));

  if (session instanceof Response) return session;

  let businesses: Array<{ id: string; name: string; city: string; status: string }>;
  let reviews: Array<{ id: string; place: string; risk: string }>;
  let locations: Array<{ id: string; title: string; confidence: number }>;

  if (!process.env.DATABASE_URL) {
    businesses = [
      { id: "biz-queue-1", name: "Rugova Zipline Tours", city: "Peja", status: "PENDING" },
      { id: "biz-queue-2", name: "Old Bazaar Coffee", city: "Gjakova", status: "PENDING" }
    ];
    reviews = [
      { id: "rev-queue-1", place: "Hatch Prizren", risk: "Possible promotional wording" },
      { id: "rev-queue-2", place: "Brezovica", risk: "Needs photo moderation" }
    ];
    locations = [
      { id: "loc-queue-1", title: "Mirusha Waterfalls Trailhead", confidence: 0.87 }
    ];
  } else {
    const [dbBusinesses, dbReviews] = await Promise.all([
      timeStep("admin.moderation.businesses", () =>
        prisma.business.findMany({
          where: { status: "PENDING" },
          select: { id: true, name: true, city: true, status: true },
          orderBy: { createdAt: "asc" },
          take: 20
        })
      ),
      timeStep("admin.moderation.reviews", () =>
        prisma.review.findMany({
          where: { status: "PENDING" },
          select: { id: true, place: { select: { title: true } }, comment: true },
          orderBy: { createdAt: "asc" },
          take: 20
        })
      )
    ]);

    businesses = dbBusinesses.map((b) => ({ id: b.id, name: b.name, city: b.city, status: b.status }));
    reviews = dbReviews.map((r) => ({
      id: r.id,
      place: r.place?.title ?? "Unknown",
      risk: r.comment.length > 80 ? "Long comment — may need review" : "Awaiting moderation"
    }));
    locations = [];
  }

  return ok({
    metrics: await timeStep("metrics.admin", () => getAdminMetrics()),
    queues: { businesses, reviews, locations }
  });
});
