import { ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getBusinessMetrics } from "@/services/analytics-service";

export const GET = withApiTiming("GET /api/businesses", async function GET() {
  const session = await timeStep("auth.requireRole", () => requireRole(["BUSINESS_OWNER", "ADMIN"], "Business dashboard access requires a business owner account."));

  if (session instanceof Response) return session;

  let profile: { name: string; status: string; visibility: string; owner: string };
  let boostSystem: { score: number; contributors: string[] };

  if (!process.env.DATABASE_URL || !session.user?.id) {
    profile = {
      name: "Soma Book Station",
      status: "APPROVED",
      visibility: "Boosted in Chill, Local Food, and Hidden Gems",
      owner: session.user.email ?? ""
    };
    boostSystem = {
      score: 74,
      contributors: ["Complete profile", "High review quality", "Recent events", "Fast route response"]
    };
  } else {
    const business = await timeStep("business.findFirst", () =>
      prisma.business.findFirst({
        where: { ownerId: session.user.id },
        select: { name: true, status: true, boostScore: true, verified: true }
      })
    );

    profile = {
      name: business?.name ?? "Your Business",
      status: business?.status ?? "PENDING",
      visibility: business?.verified
        ? "Boosted in search results"
        : "Complete onboarding to boost visibility",
      owner: session.user.email ?? ""
    };
    boostSystem = {
      score: business?.boostScore ?? 0,
      contributors: [
        ...(business?.verified ? ["Verified account"] : []),
        ...(business?.boostScore && business.boostScore > 50 ? ["High engagement"] : []),
        "Complete your profile for better ranking"
      ]
    };
  }

  return ok({
    profile,
    metrics: await timeStep("metrics.business", () => getBusinessMetrics(session.user.id)),
    boostSystem
  });
});
