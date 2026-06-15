import { places } from "@/data/kosovo-data";
import { formatCurrency } from "@/lib/utils";
import { calculateMobilityOptions } from "@/services/mobility-engine";
import { generateExperiencePulse } from "@/services/pulse-engine";
import { recommendPlaces } from "@/services/recommendation-engine";
import type { Coordinates, ItineraryDTO, ItineraryInput, ItineraryStopDTO } from "@/types";

const FULL_DAY_HOURS = 8;
const MIN_STOP_MINUTES = 35;
const MAX_STOP_MINUTES = 150;
const MAX_ITINERARY_DAYS = 14;

function getCityCenter(city: string): Coordinates | undefined {
  const cityPlaces = places.filter((place) => place.city.toLowerCase() === city.toLowerCase());

  if (!cityPlaces.length) return undefined;

  return {
    lat: cityPlaces.reduce((total, place) => total + place.coordinates.lat, 0) / cityPlaces.length,
    lng: cityPlaces.reduce((total, place) => total + place.coordinates.lng, 0) / cityPlaces.length
  };
}

function startHourFor(vibe: string) {
  if (vibe === "Nightlife" || vibe === "Romantic") return 17;
  if (vibe === "Adventure" || vibe === "Adventure & Trails") return 8;
  return 10;
}

function estimatePlaceCost(priceLevel: number, vibe: string) {
  const base = priceLevel * 7;
  const multiplier = vibe === "Nightlife" ? 1.35 : vibe === "Adventure" || vibe === "Adventure & Trails" ? 1.15 : 1;
  return Math.round(base * multiplier);
}

function minutesToClock(startHour: number, offsetMinutes: number) {
  const totalMinutes = startHour * 60 + offsetMinutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeRequestedMinutes(input: ItineraryInput) {
  const hoursFromDays = input.durationDays ? input.durationDays * FULL_DAY_HOURS : input.durationHours;
  return Math.round(Math.max(input.durationHours, hoursFromDays) * 60);
}

function dayCountFor(requestedMinutes: number, explicitDays?: number) {
  if (explicitDays) return Math.max(1, Math.min(MAX_ITINERARY_DAYS, Math.ceil(explicitDays)));
  return Math.max(1, Math.ceil(requestedMinutes / (FULL_DAY_HOURS * 60)));
}

function dayStartOffset(day: number, startHour: number) {
  return (day - 1) * 24 * 60 + startHour * 60;
}

function startTimeFor(day: number, startHour: number, dayOffsetMinutes: number) {
  const absoluteOffset = dayStartOffset(day, startHour) + dayOffsetMinutes;
  return minutesToClock(0, absoluteOffset);
}

function isMealFriendly(placeCategorySlug: string) {
  return placeCategorySlug === "restaurants" || placeCategorySlug === "cafes";
}

function categoryBonus(categorySlug: string, usedCategoryCounts: Map<string, number>) {
  return 1 / (1 + (usedCategoryCounts.get(categorySlug) ?? 0) * 0.22);
}

function selectNextCandidate(
  ranked: ReturnType<typeof recommendPlaces>,
  usedIds: Set<string>,
  usedCategoryCounts: Map<string, number>,
  dayOffset: number
) {
  const mealWindow = dayOffset >= 180 && dayOffset <= 390;
  const eveningWindow = dayOffset >= 420;

  return ranked
    .filter((item) => !usedIds.has(item.place.id))
    .map((item) => {
      const categorySlug = item.place.category.slug;
      const mealBoost = mealWindow && isMealFriendly(categorySlug) ? 13 : 0;
      const eveningBoost = eveningWindow && (item.place.vibeTags.includes("Nightlife") || categorySlug === "restaurants") ? 8 : 0;
      const shortStopPenalty = item.place.avgStayMinutes < 45 && dayOffset > 360 ? 5 : 0;

      return {
        item,
        score: item.score * categoryBonus(categorySlug, usedCategoryCounts) + mealBoost + eveningBoost - shortStopPenalty
      };
    })
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function stopDurationMinutes(remainingDayMinutes: number, remainingTotalMinutes: number, avgStayMinutes: number) {
  const target = Math.min(remainingDayMinutes, remainingTotalMinutes);
  if (target <= MIN_STOP_MINUTES) return Math.max(0, target);

  return Math.min(MAX_STOP_MINUTES, Math.max(MIN_STOP_MINUTES, Math.min(avgStayMinutes, target)));
}

export function generateItinerary(input: ItineraryInput): ItineraryDTO {
  const requestedMinutes = normalizeRequestedMinutes(input);
  const effectiveDurationHours = Math.ceil(requestedMinutes / 60);
  const durationDays = dayCountFor(requestedMinutes, input.durationDays);
  const minutesPerDay = Math.ceil(requestedMinutes / durationDays);
  const cityCenter = getCityCenter(input.city);
  const pulse = generateExperiencePulse({
    city: input.city,
    vibe: input.vibe,
    dayPart: startHourFor(input.vibe) >= 17 ? "EVENING" : "MORNING"
  });
  const cityRanked = recommendPlaces(
    {
      city: input.city,
      budget: Math.min(Math.ceil(input.budget / 25), 5),
      vibes: [input.vibe, ...input.interests],
      transportPreference: input.transportPreference,
      location: input.location ?? cityCenter,
      dayPart: pulse.crowdMode === "surging" ? "EVENING" : undefined,
      avoidCrowds: pulse.crowdMode === "surging" && input.vibe !== "Nightlife",
      limit: Math.min(50, places.filter((place) => place.city.toLowerCase() === input.city.toLowerCase()).length)
    },
    places
  );
  const regionalRanked = recommendPlaces(
    {
      budget: Math.min(Math.ceil(input.budget / 25), 5),
      vibes: [input.vibe, ...input.interests],
      transportPreference: input.transportPreference,
      location: input.location ?? cityCenter,
      dayPart: pulse.crowdMode === "surging" ? "EVENING" : undefined,
      avoidCrowds: pulse.crowdMode === "surging" && input.vibe !== "Nightlife",
      limit: Math.min(80, places.length)
    },
    places
  );
  const ranked = [...cityRanked, ...regionalRanked.filter((item) => !cityRanked.some((cityItem) => cityItem.place.id === item.place.id))];

  const start = input.location ?? cityCenter ?? ranked[0]?.place.coordinates ?? places[0].coordinates;
  const startHour = startHourFor(input.vibe);

  let previous = start;
  let day = 1;
  let dayOffset = 0;
  let plannedMinutes = 0;
  let totalCost = 0;
  let totalDistance = 0;
  let totalTravel = 0;
  const usedPlaceIds = new Set<string>();
  const usedCategoryCounts = new Map<string, number>();
  const stops: ItineraryStopDTO[] = [];

  while (plannedMinutes < requestedMinutes && day <= durationDays && usedPlaceIds.size < ranked.length) {
    if (dayOffset >= minutesPerDay) {
      day += 1;
      dayOffset = 0;
      previous = start;
      continue;
    }

    const candidate = selectNextCandidate(ranked, usedPlaceIds, usedCategoryCounts, dayOffset);
    if (!candidate) break;

    const place = candidate.place;
    const mobility = calculateMobilityOptions({
      from: previous,
      to: place.coordinates,
      preference: input.transportPreference,
      city: input.city
    })[0];

    const remainingTotal = requestedMinutes - plannedMinutes;
    const remainingDay = minutesPerDay - dayOffset;
    const allocatableStay = remainingDay - mobility.durationMinutes;

    if (allocatableStay < MIN_STOP_MINUTES && stops.length > 0) {
      day += 1;
      dayOffset = 0;
      previous = start;
      continue;
    }

    const placeCost = estimatePlaceCost(place.priceLevel, input.vibe);
    const durationMinutes = stopDurationMinutes(allocatableStay, remainingTotal - mobility.durationMinutes, place.avgStayMinutes);
    const startTime = startTimeFor(day, startHour, dayOffset + mobility.durationMinutes);

    dayOffset += mobility.durationMinutes + durationMinutes;
    plannedMinutes += mobility.durationMinutes + durationMinutes;
    totalCost += placeCost + mobility.estimatedCost;
    totalDistance += mobility.distanceKm;
    totalTravel += mobility.durationMinutes;
    previous = place.coordinates;
    usedPlaceIds.add(place.id);
    usedCategoryCounts.set(place.category.slug, (usedCategoryCounts.get(place.category.slug) ?? 0) + 1);

    stops.push({
      order: stops.length + 1,
      day,
      startTime,
      durationMinutes,
      travelMinutes: mobility.durationMinutes,
      estimatedCost: Number((placeCost + mobility.estimatedCost).toFixed(2)),
      note: `${place.vibeTags.slice(0, 2).join(" + ")} stop with ${place.crowdLevel?.toLowerCase() ?? "balanced"} energy.`,
      place,
      mobility
    });
  }

  if (plannedMinutes < requestedMinutes && stops.length) {
    const deficit = requestedMinutes - plannedMinutes;
    const extraPerStop = Math.ceil(deficit / stops.length);

    for (const stop of stops) {
      if (plannedMinutes >= requestedMinutes) break;

      const extra = Math.min(extraPerStop, requestedMinutes - plannedMinutes);
      if (extra <= 0) continue;

      stop.durationMinutes += extra;
      plannedMinutes += extra;
    }
  }

  const clippedCost = Math.min(totalCost, input.budget);
  const title =
    input.title ??
    (input.vibe === "Nightlife"
      ? `Perfect Evening in ${input.city}`
      : input.vibe === "Adventure" || input.vibe === "Adventure & Trails"
        ? `${durationDays > 1 ? `${durationDays}-Day` : "One Day"} Nature Trip from ${input.city}`
        : `${durationDays > 1 ? `${durationDays}-Day` : effectiveDurationHours >= FULL_DAY_HOURS ? "Full-Day" : input.vibe} Plan in ${input.city}`);

  return {
    title,
    description: `A ${effectiveDurationHours}-hour ${durationDays > 1 ? `${durationDays}-day ` : ""}${input.vibe.toLowerCase()} plan balanced around ${formatCurrency(
      input.budget
    )}, ${input.transportPreference.toLowerCase()}, and ${input.interests.join(", ")}.`,
    city: input.city,
    vibe: input.vibe,
    budget: input.budget,
    durationHours: effectiveDurationHours,
    durationDays,
    plannedMinutes,
    totalCost: Number(clippedCost.toFixed(2)),
    aiRationale:
      `The itinerary ranks candidates by vibe fit, quality, hidden-gem signal, budget fit, mobility, and live ${pulse.city} pulse (${pulse.liveScore}/100). It then diversifies categories, fills ${requestedMinutes} requested minutes across ${durationDays} day${durationDays === 1 ? "" : "s"}, and assigns travel time between each stop.`,
    routeSummary: {
      distanceKm: Number(totalDistance.toFixed(2)),
      travelMinutes: totalTravel,
      preferredMethod: input.transportPreference
    },
    stops
  };
}
