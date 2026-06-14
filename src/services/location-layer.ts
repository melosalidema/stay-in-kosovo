import type { Prisma } from "@prisma/client";

import { events as fallbackEvents, places as fallbackPlaces } from "@/data/kosovo-data";
import { isDatabaseReachable, markDatabaseUnavailable } from "@/lib/database-availability";
import { geocodeKosovoLocation } from "@/lib/geocoding";
import { hasNumericCoordinates, isCoordinateInsideKosovo } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { timeStep } from "@/lib/performance";
import { safeJson } from "@/lib/utils";
import type { Coordinates, PlaceDTO } from "@/types";

type MaybeLocatedPlace = Omit<PlaceDTO, "coordinates"> & {
  coordinates?: Partial<Coordinates> | null;
};

type DbMapPlace = Prisma.PlaceGetPayload<{
  include: {
    category: true;
    business: {
      select: {
        id: true;
        name: true;
        verified: true;
        boostScore: true;
      };
    };
  };
}>;

type DbMapEvent = Prisma.EventGetPayload<{
  include: {
    category: true;
    place: {
      include: {
        category: true;
        business: {
          select: {
            id: true;
            name: true;
            verified: true;
            boostScore: true;
          };
        };
      };
    };
  };
}>;

function dbPlaceToDTO(place: DbMapPlace): PlaceDTO {
  return {
    id: place.id,
    title: place.title,
    slug: place.slug,
    description: place.description,
    city: place.city,
    address: place.address,
    category: {
      id: place.category.id,
      name: place.category.name,
      slug: place.category.slug,
      type: place.category.type,
      icon: place.category.icon
    },
    coordinates: {
      lat: Number(place.latitude),
      lng: Number(place.longitude)
    },
    priceLevel: place.priceLevel,
    rating: place.rating,
    reviewCount: place.reviewCount,
    avgStayMinutes: place.avgStayMinutes,
    openNow: place.openNow,
    vibeTags: place.vibeTags,
    atmosphereTags: place.atmosphereTags,
    musicVibe: place.musicVibe ?? undefined,
    crowdLevel: place.crowdLevel ?? undefined,
    images: place.images,
    transportation: safeJson(place.transportation, {
      walkingFriendly: false,
      taxiMinutes: 12,
      busAvailable: false
    }),
    accessibility: safeJson(place.accessibility, {}),
    popularityScore: place.popularityScore,
    hiddenGemScore: place.hiddenGemScore,
    business: place.business
      ? {
          id: place.business.id,
          name: place.business.name,
          verified: place.business.verified,
          boostScore: place.business.boostScore
        }
      : undefined
  };
}

function resolvePlaceCoordinates(place: MaybeLocatedPlace) {
  if (hasNumericCoordinates(place.coordinates) && isCoordinateInsideKosovo(place.coordinates)) {
    return place.coordinates;
  }

  return geocodeKosovoLocation({
    name: place.title,
    address: place.address,
    city: place.city
  });
}

function eventToPlaceDTO(event: DbMapEvent): PlaceDTO | null {
  if (!event.place) return null;

  const venue = dbPlaceToDTO(event.place);

  return {
    ...venue,
    id: event.id,
    title: event.title,
    slug: venue.slug,
    description: event.description,
    city: event.city,
    category: {
      id: event.category.id,
      name: event.category.name,
      slug: event.category.slug,
      type: event.category.type,
      icon: event.category.icon
    },
    priceLevel: Math.max(1, Math.min(5, Math.ceil(Number(event.price) / 10))),
    rating: venue.rating,
    reviewCount: venue.reviewCount,
    avgStayMinutes: Math.max(30, Math.round((event.endsAt.getTime() - event.startsAt.getTime()) / 60000)),
    openNow: event.startsAt.getTime() <= Date.now() && event.endsAt.getTime() >= Date.now(),
    vibeTags: event.vibeTags,
    atmosphereTags: [...event.vibeTags, "event"],
    images: event.images.length ? event.images : venue.images,
    popularityScore: event.heatScore,
    hiddenGemScore: venue.hiddenGemScore
  };
}

function fallbackEventToPlaceDTO(event: (typeof fallbackEvents)[number]) {
  const venue = fallbackPlaces.find((place) => place.slug === event.placeSlug);

  if (!venue) return null;

  return {
    ...venue,
    id: event.id,
    title: event.title,
    description: event.description,
    city: event.city,
    category: {
      id: "cat-events",
      name: "Events",
      slug: "events",
      type: "EVENT",
      icon: "Calendar"
    },
    priceLevel: Math.max(1, Math.min(5, Math.ceil(event.price / 10))),
    avgStayMinutes: Math.max(30, Math.round((new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 60000)),
    openNow: new Date(event.startsAt).getTime() <= Date.now() && new Date(event.endsAt).getTime() >= Date.now(),
    vibeTags: event.vibeTags,
    atmosphereTags: [...event.vibeTags, "event"],
    images: event.images.length ? event.images : venue.images,
    popularityScore: event.heatScore
  };
}

export function buildLocationLayer(sourcePlaces: MaybeLocatedPlace[]) {
  const seen = new Set<string>();
  const locationPlaces: PlaceDTO[] = [];

  for (const sourcePlace of sourcePlaces) {
    const coordinates = resolvePlaceCoordinates(sourcePlace);

    if (!coordinates) continue;

    const key = sourcePlace.category.type === "EVENT" ? sourcePlace.id : sourcePlace.slug || sourcePlace.id;
    if (seen.has(key)) continue;

    seen.add(key);
    locationPlaces.push({
      ...sourcePlace,
      coordinates
    });
  }

  return locationPlaces;
}

export function buildFallbackHomepageLocationLayer() {
  return buildLocationLayer([
    ...fallbackPlaces,
    ...fallbackEvents.map(fallbackEventToPlaceDTO).filter((eventPlace): eventPlace is PlaceDTO => Boolean(eventPlace))
  ]);
}

export async function getHomepageMapPlaces() {
  if (!process.env.DATABASE_URL || !(await isDatabaseReachable())) {
    return buildFallbackHomepageLocationLayer();
  }

  try {
    const [dbPlaces, dbEvents] = await Promise.all([
      timeStep("locations.homepageMap.findMany", () =>
        prisma.place.findMany({
          include: {
            category: true,
            business: {
              select: {
                id: true,
                name: true,
                verified: true,
                boostScore: true
              }
            }
          },
          orderBy: [{ popularityScore: "desc" }, { rating: "desc" }, { title: "asc" }]
        })
      ),
      timeStep("locations.homepageMap.events.findMany", () =>
        prisma.event.findMany({
          include: {
            category: true,
            place: {
              include: {
                category: true,
                business: {
                  select: {
                    id: true,
                    name: true,
                    verified: true,
                    boostScore: true
                  }
                }
              }
            }
          },
          orderBy: [{ heatScore: "desc" }, { startsAt: "asc" }]
        })
      )
    ]);

    return buildLocationLayer([
      ...dbPlaces.map(dbPlaceToDTO),
      ...dbEvents.map(eventToPlaceDTO).filter((eventPlace): eventPlace is PlaceDTO => Boolean(eventPlace))
    ]);
  } catch (error) {
    markDatabaseUnavailable();
    console.warn("Falling back to static homepage map places:", error);
    return buildFallbackHomepageLocationLayer();
  }
}
