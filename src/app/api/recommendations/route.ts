import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { recommendationSchema } from "@/lib/validation";
import { getPlaces } from "@/services/place-service";
import { buildPreferenceProfile, defaultPreferenceProfile } from "@/services/profile-engine";
import { explainRecommendationSystem, recommendPlaces } from "@/services/recommendation-engine";
import type { InteractionInput } from "@/types";

function hasSessionCookie(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";

  return (
    cookie.includes("next-auth.session-token") ||
    cookie.includes("__Secure-next-auth.session-token") ||
    cookie.includes("authjs.session-token") ||
    cookie.includes("__Secure-authjs.session-token")
  );
}

export const POST = withApiTiming("POST /api/recommendations", async function POST(request: Request) {
  const limited = await rateLimit(getClientKey(request, "recommendations"), 40, 60_000);

  if (!limited.allowed) {
    return fail("Recommendation rate limit reached.", 429);
  }

  const parsed = await validateBody(request, recommendationSchema, "Invalid recommendation request.");

  if (!parsed.ok) return parsed.error;

  const { places: candidates } = await timeStep("places.get", () =>
    getPlaces({
      city: parsed.data.city,
      budget: parsed.data.budget,
      openNow: parsed.data.openNow,
      take: 50
    })
  );

  const session = hasSessionCookie(request) ? await timeStep("auth.session", () => getCurrentSession()) : null;
  let interactionProfile = defaultPreferenceProfile;

  if (session?.user?.id && process.env.DATABASE_URL) {
    const interactions = await timeStep("interactions.findRecent", () =>
      prisma.userInteraction
        .findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 80
        })
        .catch(() => [])
    );

    if (interactions.length) {
      interactionProfile = await timeStep("profile.build", () =>
        buildPreferenceProfile(
          interactions.map((interaction) => {
            const metadata =
              interaction.metadata && typeof interaction.metadata === "object" && !Array.isArray(interaction.metadata)
                ? (interaction.metadata as Record<string, unknown>)
                : undefined;

            return {
              type: interaction.type,
              placeId: interaction.placeId ?? undefined,
              eventId: interaction.eventId ?? undefined,
              weight: interaction.weight,
              metadata: metadata as InteractionInput["metadata"]
            } satisfies InteractionInput;
          }),
          candidates
        )
      );
    }
  }

  const recommendations = await timeStep("recommendations.rank", () =>
    recommendPlaces({ ...parsed.data, interactionProfile }, candidates)
  );

  return ok({
    recommendations,
    engine: explainRecommendationSystem(),
    profile: interactionProfile
  });
});
