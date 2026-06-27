import type { Prisma } from "@prisma/client";

import { places as fallbackPlaces } from "@/data/kosovo-data";
import { isDatabaseReachable, markDatabaseUnavailable } from "@/lib/database-availability";
import { logger } from "@/lib/logger";
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
  cursor?: string;
  take?: number;
};

export type PaginatedPlaces = {
  places: PlaceDTO[];
  cursor: string | null;
  hasMore: boolean;
};

async function fullTextPlaceIds(query: string, limit: number): Promise<string[] | null> {
  const trimmed = query.trim();

  if (!trimmed) return null;

  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "Place"."id"
      FROM "Place"
      WHERE "Place"."searchVector" @@ plainto_tsquery('simple', ${trimmed})
      ORDER BY ts_rank("Place"."searchVector", plainto_tsquery('simple', ${trimmed})) DESC,
               "Place"."popularityScore" DESC,
               "Place"."rating" DESC
      LIMIT ${limit};
    `;

    return rows.map((row) => row.id);
  } catch (error) {
    logger.warn({ error }, "Full-text search fallback to ILIKE");
    return null;
  }
}

const placeListCache = new Map<string, { expiresAt: number; data: PaginatedPlaces }>();
const placeListInFlight = new Map<string, Promise<PaginatedPlaces>>();
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

function filterFallback(filters: PlaceFilters): PaginatedPlaces {
  const query = filters.q?.toLowerCase().trim();
  const take = filters.take ?? 50;

  const filtered = fallbackPlaces.filter((place) => {
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
  });

  const hasMore = filtered.length > take;
  const places = filtered.slice(0, take);
  const cursor = hasMore ? places[places.length - 1]?.id ?? null : null;

  return { places, cursor, hasMore };
}

export async function getPlaces(filters: PlaceFilters = {}): Promise<PaginatedPlaces> {
  if (!process.env.DATABASE_URL || !(await isDatabaseReachable())) {
    return filterFallback(filters);
  }

  const cacheKey = stableCacheKey(filters);
  const cached = placeListCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const inFlight = placeListInFlight.get(cacheKey);
  if (inFlight) return timeStep("places.cacheWait", () => inFlight.catch(() => filterFallback(filters)));

  const take = filters.take ?? 50;

  const loadPlaces = (async (): Promise<PaginatedPlaces> => {
    const fullTextIds = filters.q ? await timeStep("places.fullText", () => fullTextPlaceIds(filters.q!, take + 1)) : null;

    const where: Prisma.PlaceWhereInput = {
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.vibe ? { vibeTags: { has: filters.vibe } } : {}),
      ...(filters.budget ? { priceLevel: { lte: filters.budget } } : {}),
      ...(filters.openNow !== undefined ? { openNow: filters.openNow } : {}),
      ...(filters.rating ? { rating: { gte: filters.rating } } : {}),
      ...(fullTextIds ? { id: { in: fullTextIds } } : {}),
      ...(filters.q && !fullTextIds
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
        ...(fullTextIds ? {} : { orderBy: [{ popularityScore: "desc" }, { rating: "desc" }] }),
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
        take: take + 1
      })
    );

    const byId = new Map(dbPlaces.map((place) => [place.id, place]));
    let mapped = fullTextIds
      ? fullTextIds
          .map((id) => byId.get(id))
          .filter((place): place is DbPlace => Boolean(place))
          .map(toPlaceDTO)
      : dbPlaces.map(toPlaceDTO);

    if (filters.transport) {
      mapped = mapped.filter(
        (place) =>
          (filters.transport === "WALKING" && place.transportation.walkingFriendly) ||
          (filters.transport === "BUS" && place.transportation.busAvailable) ||
          filters.transport === "TAXI" ||
          filters.transport === "CAR"
      );
    }

    const hasMore = mapped.length > take;
    const places = mapped.slice(0, take);
    const cursor = hasMore ? places[places.length - 1]?.id ?? null : null;

    return { places, cursor, hasMore };
  })();

  placeListInFlight.set(cacheKey, loadPlaces);

  try {
    const data = await loadPlaces;
    placeListCache.set(cacheKey, { expiresAt: Date.now() + placeCacheTtlMs, data });
    return data;
  } catch (error) {
    markDatabaseUnavailable();
    logger.warn({ error }, "Falling back to static place data");
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
