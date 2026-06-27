import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { getCurrentSession } from "@/lib/auth/permissions";
import { csrfProtect } from "@/lib/csrf";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validation";

export const POST = withApiTiming("POST /api/reviews", async function POST(request: Request) {
  const csrfError = await csrfProtect(request);
  if (csrfError) return csrfError;

  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user) {
    return fail("You must be signed in to leave a review.", 401);
  }

  const limited = await rateLimit(getClientKey(request, "reviews"), 20, 60_000);

  if (!limited.allowed) {
    return fail("Review rate limit reached.", 429);
  }

  const parsed = await validateBody(request, reviewSchema, "Invalid review payload.");

  if (!parsed.ok) return parsed.error;

  const reviewData = parsed.data;

  if (!process.env.DATABASE_URL) {
    return ok({
      accepted: true,
      moderationStatus: "APPROVED",
      review: reviewData
    });
  }

  const place = await timeStep("review.placeLookup", () =>
    prisma.place.findFirst({
      where: {
        OR: [{ id: reviewData.placeId }, { slug: reviewData.placeId }]
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
        rating: reviewData.rating,
        comment: reviewData.comment,
        atmosphereTags: reviewData.atmosphereTags,
        crowdLevel: reviewData.crowdLevel,
        musicVibe: reviewData.musicVibe,
        localPopularity: reviewData.localPopularity,
        photos: reviewData.photos,
        status: "PENDING"
      }
    })
  );

  return ok({ review }, { status: 201 });
});