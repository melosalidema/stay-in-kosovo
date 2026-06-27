import { Prisma } from "@prisma/client";

import { places } from "@/data/kosovo-data";
import { isDatabaseReachable } from "@/lib/database-availability";
import { logger } from "@/lib/logger";
import { timeStep } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { clamp } from "@/lib/utils";
import { buildPreferenceProfile } from "@/services/profile-engine";
import type { InteractionInput } from "@/types";

function interactionWeight(input: InteractionInput) {
  if (input.weight) return input.weight;

  return (
    {
      VIEW: 0.4,
      SAVE: 1.4,
      REVIEW: 1.8,
      CHECK_IN: 2,
      SHARE: 1.1,
      ROUTE_REQUEST: 0.9,
      ITINERARY_ADD: 1.5
    } satisfies Record<InteractionInput["type"], number>
  )[input.type];
}

export async function trackInteraction(input: InteractionInput, userId?: string) {
  const weight = clamp(interactionWeight(input), 0.1, 5);
  const fallbackPlace = places.find((place) => place.id === input.placeId || place.slug === input.placeId);
  const simulatedProfile = buildPreferenceProfile([{ ...input, weight }], places);

  if (!userId && input.type === "VIEW") {
    return {
      persisted: false,
      interaction: { ...input, placeId: fallbackPlace?.id ?? input.placeId, weight },
      profileDelta: simulatedProfile,
      message: "Anonymous view accepted without persistence to avoid high-volume passive tracking writes."
    };
  }

  if (!(await timeStep("db.reachable", () => isDatabaseReachable()))) {
    return {
      persisted: false,
      interaction: { ...input, placeId: fallbackPlace?.id ?? input.placeId, weight },
      profileDelta: simulatedProfile,
      message: "Interaction accepted in prototype mode. Connect PostgreSQL to persist event history."
    };
  }

  try {
    const dbPlace = input.placeId
      ? await timeStep("interaction.placeLookup", () =>
          prisma.place.findFirst({
            where: { OR: [{ id: input.placeId }, { slug: input.placeId }] },
            select: { id: true }
          })
        )
      : null;

    const interaction = await timeStep("interaction.create", () =>
      prisma.userInteraction.create({
        data: {
          userId,
          placeId: dbPlace?.id,
          eventId: input.eventId,
          type: input.type,
          weight,
          ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {})
        }
      })
    );

    return {
      persisted: true,
      interaction,
      profileDelta: simulatedProfile,
      message: "Interaction stored. Recommendation, business analytics, and badge systems can consume it."
    };
  } catch (error) {
    logger.warn({ error }, "Interaction persistence unavailable, using prototype response");

    return {
      persisted: false,
      interaction: { ...input, placeId: fallbackPlace?.id ?? input.placeId, weight },
      profileDelta: simulatedProfile,
      message: "Interaction accepted without persistence because PostgreSQL is not reachable."
    };
  }
}
