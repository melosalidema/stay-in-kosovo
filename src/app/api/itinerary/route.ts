import { Prisma } from "@prisma/client";

import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { getCurrentSession } from "@/lib/auth/permissions";
import { csrfProtect } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { itinerarySchema } from "@/lib/validation";
import { generateItinerary } from "@/services/itinerary-engine";

export const GET = withApiTiming("GET /api/itinerary", async function GET() {
  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user || !process.env.DATABASE_URL) {
    return ok({ itineraries: [] });
  }

  const itineraries = await timeStep("itinerary.findMany", () =>
    prisma.itinerary.findMany({
      where: { userId: session.user.id },
      include: {
        stops: {
          orderBy: { order: "asc" },
          include: { place: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  );

  return ok({ itineraries });
});

export const POST = withApiTiming("POST /api/itinerary", async function POST(request: Request) {
  const csrfError = await csrfProtect(request);
  if (csrfError) return csrfError;

  const limited = await rateLimit(getClientKey(request, "itinerary"), 20, 60_000);

  if (!limited.allowed) {
    return fail("Itinerary generation rate limit reached.", 429);
  }

  const parsed = await validateBody(request, itinerarySchema, "Invalid itinerary request.");

  if (!parsed.ok) return parsed.error;

  const session = await timeStep("auth.session", () => getCurrentSession());
  const itinerary = await timeStep("itinerary.generate", () => generateItinerary({ ...parsed.data, userId: session?.user?.id }));
  let persistedId: string | null = null;

  if (session?.user?.id && process.env.DATABASE_URL) {
    try {
      const created = await timeStep("itinerary.create", () =>
        prisma.itinerary.create({
          data: {
            userId: session.user.id,
            title: itinerary.title,
            description: itinerary.description,
            city: itinerary.city,
            vibe: itinerary.vibe,
            budget: new Prisma.Decimal(itinerary.budget),
            durationHours: itinerary.durationHours,
            transportPreference: itinerary.routeSummary.preferredMethod,
            totalCost: new Prisma.Decimal(itinerary.totalCost),
            aiRationale: itinerary.aiRationale,
            routeSummary: itinerary.routeSummary,
            stops: {
              create: itinerary.stops.map((stop) => ({
                order: stop.order,
                startTime: stop.startTime,
                durationMinutes: stop.durationMinutes,
                travelMinutes: stop.travelMinutes,
                estimatedCost: new Prisma.Decimal(stop.estimatedCost),
                note: stop.note,
                place: {
                  connect: { slug: stop.place.slug }
                }
              }))
            }
          },
          select: { id: true }
        })
      );
      persistedId = created.id;
    } catch (error) {
      logger.warn({ error }, "Generated itinerary was not persisted");
    }
  }

  return ok({
    itinerary,
    persistedId,
    engine: {
      generation:
        "Rank places, diversify stops, estimate per-stop cost, calculate mobility between stops, then assign a timeline.",
      personalization:
        "The current prototype uses explicit request preferences. Production can blend profile vectors and UserInteraction events."
    }
  });
});
