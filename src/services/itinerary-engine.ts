import { places } from "@/data/kosovo-data";
import { formatCurrency } from "@/lib/utils";
import { calculateMobilityOptions } from "@/services/mobility-engine";
import { generateExperiencePulse } from "@/services/pulse-engine";
import { recommendPlaces } from "@/services/recommendation-engine";
import type { Coordinates, ItineraryDTO, ItineraryInput, ItineraryStopDTO } from "@/types";

const cityCenters: Record<string, Coordinates> = {
  Prishtina: { lat: 42.6629, lng: 21.1655 },
  Prizren: { lat: 42.2097, lng: 20.7397 },
  Peja: { lat: 42.6591, lng: 20.2883 },
  Gjakova: { lat: 42.3803, lng: 20.4308 },
  Brezovica: { lat: 42.2208, lng: 21.0075 }
};

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

export function generateItinerary(input: ItineraryInput): ItineraryDTO {
  const pulse = generateExperiencePulse({
    city: input.city,
    vibe: input.vibe,
    dayPart: startHourFor(input.vibe) >= 17 ? "EVENING" : "MORNING"
  });
  const ranked = recommendPlaces(
    {
      city: input.city,
      budget: Math.min(Math.ceil(input.budget / 25), 5),
      vibes: [input.vibe, ...input.interests],
      transportPreference: input.transportPreference,
      location: input.location ?? cityCenters[input.city],
      dayPart: pulse.crowdMode === "surging" ? "EVENING" : undefined,
      avoidCrowds: pulse.crowdMode === "surging" && input.vibe !== "Nightlife"
    },
    places
  );

  const maxStops = Math.max(2, Math.min(5, Math.floor(input.durationHours / 1.5)));
  const selected = ranked.slice(0, maxStops).map((item) => item.place);
  const start = input.location ?? cityCenters[input.city] ?? selected[0]?.coordinates ?? cityCenters.Prishtina;
  const startHour = startHourFor(input.vibe);

  let previous = start;
  let offset = 0;
  let totalCost = 0;
  let totalDistance = 0;
  let totalTravel = 0;

  const stops: ItineraryStopDTO[] = selected.map((place, index) => {
    const mobility = calculateMobilityOptions({
      from: previous,
      to: place.coordinates,
      preference: input.transportPreference,
      city: input.city
    })[0];
    const placeCost = estimatePlaceCost(place.priceLevel, input.vibe);
    const durationMinutes = Math.min(place.avgStayMinutes, Math.max(45, Math.floor((input.durationHours * 60) / maxStops) - 20));
    const startTime = minutesToClock(startHour, offset + mobility.durationMinutes);

    offset += mobility.durationMinutes + durationMinutes;
    totalCost += placeCost + mobility.estimatedCost;
    totalDistance += mobility.distanceKm;
    totalTravel += mobility.durationMinutes;
    previous = place.coordinates;

    return {
      order: index + 1,
      startTime,
      durationMinutes,
      travelMinutes: mobility.durationMinutes,
      estimatedCost: Number((placeCost + mobility.estimatedCost).toFixed(2)),
      note: `${place.vibeTags.slice(0, 2).join(" + ")} stop with ${place.crowdLevel?.toLowerCase() ?? "balanced"} energy.`,
      place,
      mobility
    };
  });

  const clippedCost = Math.min(totalCost, input.budget);
  const title =
    input.title ??
    (input.vibe === "Nightlife"
      ? `Perfect Evening in ${input.city}`
      : input.vibe === "Adventure" || input.vibe === "Adventure & Trails"
        ? `One Day Nature Trip from ${input.city}`
        : `${input.vibe} Day in ${input.city}`);

  return {
    title,
    description: `A ${input.durationHours}-hour ${input.vibe.toLowerCase()} plan balanced around ${formatCurrency(
      input.budget
    )}, ${input.transportPreference.toLowerCase()}, and ${input.interests.join(", ")}.`,
    city: input.city,
    vibe: input.vibe,
    budget: input.budget,
    durationHours: input.durationHours,
    totalCost: Number(clippedCost.toFixed(2)),
    aiRationale:
      `The itinerary ranks candidates by vibe fit, quality, hidden-gem signal, budget fit, mobility, and live ${pulse.city} pulse (${pulse.liveScore}/100). It then diversifies stops and assigns travel time between each stop.`,
    routeSummary: {
      distanceKm: Number(totalDistance.toFixed(2)),
      travelMinutes: totalTravel,
      preferredMethod: input.transportPreference
    },
    stops
  };
}
