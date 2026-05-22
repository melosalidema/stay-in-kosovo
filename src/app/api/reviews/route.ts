import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validation";

export const POST = withApiTiming("POST /api/reviews", async function POST(request: Request) {
  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user) {
    return fail("You must be signed in to leave a review.", 401);
  }

  const limited = rateLimit(getClientKey(request, "reviews"), 20, 60_000);

  if (!limited.allowed) {
    return fail("Review rate limit reached.", 429);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => reviewSchema.safeParse(body));

  if (!parsed.success) {
    return fail("Invalid review payload.", 422, parsed.error.flatten());
  }

  if (!process.env.DATABASE_URL) {
    return ok({
      accepted: true,
      moderationStatus: "APPROVED",
      review: parsed.data
    });
  }

  const place = await timeStep("review.placeLookup", () =>
    prisma.place.findFirst({
      where: {
        OR: [{ id: parsed.data.placeId }, { slug: parsed.data.placeId }]
      },
      select: { id: true }
    })
  );

  if (!place) {
    return fail("Place not found for review.", 404);
  }

  const review = await timeStep("review.create", () =>
    prisma.review.create({
      data: {
        userId: session.user.id,
        placeId: place.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        atmosphereTags: parsed.data.atmosphereTags,
        crowdLevel: parsed.data.crowdLevel,
        musicVibe: parsed.data.musicVibe,
        localPopularity: parsed.data.localPopularity,
        photos: parsed.data.photos
      }
    })
  );

  return ok({ review }, { status: 201 });
});
