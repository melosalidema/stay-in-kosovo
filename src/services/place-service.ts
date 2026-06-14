import type { Prisma } from "@prisma/client";

import { places as fallbackPlaces } from "@/data/kosovo-data";
import { isDatabaseReachable, markDatabaseUnavailable } from "@/lib/database-availability";
import { timeStep } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { safeJson } from "@/lib/utils";
import type { PlaceDTO } from "@/types";

type DbPlace = Prisma.PlaceGetPayload<{
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

export type PlaceFilters = {
  q?: string;
  city?: string;
  category?: string;
  vibe?: string;
  budget?: number;
  openNow?: boolean;
  rating?: number;
  transport?: string;
  limit?: number;
};

const placeListCache = new Map<string, { expiresAt: number; data: PlaceDTO[] }>();
const placeListInFlight = new Map<string, Promise<PlaceDTO[]>>();
const placeByIdCache = new Map<string, { expiresAt: number; data: PlaceDTO | null }>();
const placeByIdInFlight = new Map<string, Promise<PlaceDTO | null>>();
const placeCacheTtlMs = Number(process.env.PLACE_CACHE_TTL_MS ?? 30_000);

function stableCacheKey(value: Record<string, unknown>) {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const item = value[key];
        if (item !== undefined && item !== "") acc[key] = item;
        return acc;
      }, {})
  );
}

function toPlaceDTO(place: DbPlace): PlaceDTO {
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

function filterFallback(filters: PlaceFilters) {
  const query = filters.q?.toLowerCase().trim();

  return fallbackPlaces
    .filter((place) => {
      const matchesQuery =
        !query ||
        [place.title, place.description, place.address, place.city, place.category.name]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCity = !filters.city || place.city.toLowerCase() === filters.city.toLowerCase();
      const matchesCategory = !filters.category || place.category.slug === filters.category;
      const matchesVibe = !filters.vibe || place.vibeTags.includes(filters.vibe);
      const matchesBudget = !filters.budget || place.priceLevel <= filters.budget;
      const matchesOpen = filters.openNow === undefined || place.openNow === filters.openNow;
      const matchesRating = !filters.rating || place.rating >= filters.rating;
      const matchesTransport =
        !filters.transport ||
        (filters.transport === "WALKING" && place.transportation.walkingFriendly) ||
        (filters.transport === "BUS" && place.transportation.busAvailable) ||
        filters.transport === "TAXI";

      return (
        matchesQuery &&
        matchesCity &&
        matchesCategory &&
        matchesVibe &&
        matchesBudget &&
        matchesOpen &&
        matchesRating &&
        matchesTransport
      );
    })
    .slice(0, filters.limit ?? 50);
}

export async function getPlaces(filters: PlaceFilters = {}) {
  if (!process.env.DATABASE_URL || !(await isDatabaseReachable())) {
    return filterFallback(filters);
  }

  const cacheKey = stableCacheKey(filters);
  const cached = placeListCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const inFlight = placeListInFlight.get(cacheKey);
  if (inFlight) return timeStep("places.cacheWait", () => inFlight.catch(() => filterFallback(filters)));

  const loadPlaces = (async () => {
    const where: Prisma.PlaceWhereInput = {
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.vibe ? { vibeTags: { has: filters.vibe } } : {}),
      ...(filters.budget ? { priceLevel: { lte: filters.budget } } : {}),
      ...(filters.openNow !== undefined ? { openNow: filters.openNow } : {}),
      ...(filters.rating ? { rating: { gte: filters.rating } } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
              { address: { contains: filters.q, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const dbPlaces = await timeStep("places.findMany", () =>
      prisma.place.findMany({
        where,
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
        orderBy: [{ popularityScore: "desc" }, { rating: "desc" }],
        take: filters.limit ?? 50
      })
    );

    const mapped = dbPlaces.map(toPlaceDTO);

    if (filters.transport) {
      return mapped.filter(
        (place) =>
          (filters.transport === "WALKING" && place.transportation.walkingFriendly) ||
          (filters.transport === "BUS" && place.transportation.busAvailable) ||
          filters.transport === "TAXI" ||
          filters.transport === "CAR"
      );
    }

    return mapped;
  })();

  placeListInFlight.set(cacheKey, loadPlaces);

  try {
    const data = await loadPlaces;
    placeListCache.set(cacheKey, { expiresAt: Date.now() + placeCacheTtlMs, data });
    return data;
  } catch (error) {
    markDatabaseUnavailable();
    console.warn("Falling back to static place data:", error);
    const fallback = filterFallback(filters);
    placeListCache.set(cacheKey, { expiresAt: Date.now() + Math.min(placeCacheTtlMs, 10_000), data: fallback });
    return fallback;
  } finally {
    placeListInFlight.delete(cacheKey);
  }
}

export async function getPlaceBySlugOrId(slugOrId: string) {
  const fallback = fallbackPlaces.find((place) => place.slug === slugOrId || place.id === slugOrId);

  if (!process.env.DATABASE_URL || !(await isDatabaseReachable())) {
    return fallback ?? null;
  }

  const cached = placeByIdCache.get(slugOrId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const inFlight = placeByIdInFlight.get(slugOrId);
  if (inFlight) return timeStep("places.cacheWait", () => inFlight.catch(() => fallback ?? null));

  const loadPlace = (async () => {
    const place = await timeStep("places.findByIdOrSlug", () =>
      prisma.place.findFirst({
        where: {
          OR: [{ id: slugOrId }, { slug: slugOrId }]
        },
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
      })
    );

    return place ? toPlaceDTO(place) : fallback ?? null;
  })();

  placeByIdInFlight.set(slugOrId, loadPlace);

  try {
    const data = await loadPlace;
    placeByIdCache.set(slugOrId, { expiresAt: Date.now() + placeCacheTtlMs, data });
    return data;
  } catch {
    markDatabaseUnavailable();
    return fallback ?? null;
  } finally {
    placeByIdInFlight.delete(slugOrId);
  }
}
