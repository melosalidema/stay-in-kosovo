import { events, places, transportPoints, vibes } from "@/data/kosovo-data";
import { ALL_KOSOVO_CITY } from "@/lib/place-options";
import { clamp } from "@/lib/utils";
import type { ExperiencePulseDTO, PlaceDTO, PulseInput, PulseInsight, PulseZone } from "@/types";

const ALL_KOSOVO_PULSE_CITY = "All Kosovo";
type TransportPoint = (typeof transportPoints)[number];

function demandLevel(intensity: number): PulseZone["demandLevel"] {
  if (intensity >= 90) return "surging";
  if (intensity >= 70) return "high";
  if (intensity >= 48) return "medium";
  return "low";
}

function crowdMode(score: number): ExperiencePulseDTO["crowdMode"] {
  if (score >= 90) return "surging";
  if (score >= 70) return "lively";
  if (score >= 45) return "balanced";
  return "calm";
}

function primaryVibeFor(place: PlaceDTO, requestedVibe?: string) {
  if (requestedVibe && place.vibeTags.includes(requestedVibe)) return requestedVibe;
  return place.vibeTags[0] ?? "Hidden Gems";
}

function eventHeatFor(place: PlaceDTO) {
  const related = events.filter((event) => event.placeSlug === place.slug);
  if (!related.length) return 0;
  return Math.max(...related.map((event) => event.heatScore));
}

function transportReliability(city: string) {
  const points = transportPoints.filter((point) => point.city === city);
  if (!points.length) return 58;
  return points.reduce((total, point) => total + point.reliabilityScore, 0) / points.length;
}

function averageTransportReliability(points: readonly TransportPoint[]) {
  return points.length > 0 ? points.reduce((total, point) => total + point.reliabilityScore, 0) / points.length : 58;
}

function pressureFor(place: PlaceDTO, intensity: number): PulseZone["mobilityPressure"] {
  if (intensity > 78 && !place.transportation.walkingFriendly) return "busy";
  if (place.transportation.busAvailable || place.transportation.walkingFriendly) return "easy";
  return "moderate";
}

function zoneSummary(place: PlaceDTO, intensity: number) {
  if (intensity >= 90) return `${place.title} is where the crowd is heading right now.`;
  if (place.hiddenGemScore >= 68) return `${place.title} is still under the radar, and worth a look.`;
  return `${place.title} is a steady favourite and easy to reach.`;
}

function buildZones(input: PulseInput, candidates: PlaceDTO[]): PulseZone[] {
  return candidates
    .map((place) => {
      const eventHeat = eventHeatFor(place);
      const transport = transportReliability(place.city);
      const vibeMatch = input.vibe && place.vibeTags.includes(input.vibe) ? 10 : 0;
      const dayPartBoost =
        input.dayPart === "EVENING" && place.vibeTags.includes("Nightlife")
          ? 9
          : input.dayPart === "MORNING" &&
              (place.vibeTags.includes("Adventure") || place.vibeTags.includes("Adventure & Trails"))
            ? 7
            : 0;
      const intensity = clamp(
        place.popularityScore * 0.32 +
          place.hiddenGemScore * 0.2 +
          place.rating * 8 +
          eventHeat * 0.22 +
          transport * 0.08 +
          vibeMatch +
          dayPartBoost,
        1,
        99
      );

      return {
        id: place.id,
        title: place.title,
        city: place.city,
        coordinates: place.coordinates,
        intensity: Math.round(intensity),
        primaryVibe: primaryVibeFor(place, input.vibe),
        demandLevel: demandLevel(intensity),
        mobilityPressure: pressureFor(place, intensity),
        summary: zoneSummary(place, intensity)
      } satisfies PulseZone;
    })
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 6);
}

function buildTopVibes(candidates: PlaceDTO[]) {
  return vibes
    .map((vibe) => {
      const matchingPlaces = candidates.filter((place) => place.vibeTags.includes(vibe.name));
      const matchingEvents = events.filter((event) => event.vibeTags.includes(vibe.name));
      const placeScore = matchingPlaces.reduce((total, place) => total + place.popularityScore + place.hiddenGemScore, 0);
      const eventScore = matchingEvents.reduce((total, event) => total + event.heatScore, 0);
      const supplyNormalizer = Math.max(matchingPlaces.length * 2 + matchingEvents.length, 1);

      return {
        vibe: vibe.name,
        score: Math.round(clamp((placeScore + eventScore) / supplyNormalizer, 1, 100))
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildSupplyGaps(candidates: PlaceDTO[]) {
  return buildTopVibes(candidates)
    .map((item) => {
      const supply = candidates.filter((place) => place.vibeTags.includes(item.vibe)).length;
      const demand = item.score;
      const delta = Math.max(0, demand - supply * 14);

      return {
        vibe: item.vibe,
        demand,
        supply,
        opportunity:
          delta > 30
            ? `There's more appetite for ${item.vibe.toLowerCase()} here than there are places to go.`
            : `There's a healthy amount of ${item.vibe.toLowerCase()} here already.`
      };
    })
    .filter((item) => item.demand > 54)
    .slice(0, 4);
}

function buildInsights(zones: PulseZone[], liveScore: number, transport: readonly TransportPoint[]): PulseInsight[] {
  const averageReliability = averageTransportReliability(transport);
  const highDemand = zones.filter((zone) => zone.demandLevel === "high" || zone.demandLevel === "surging").length;

  return [
    {
      label: "How busy it is",
      value: `${Math.round(liveScore)}/100`,
      detail: "Based on how popular places are, how well they're reviewed, what's on nearby and how easy they are to reach.",
      tone: liveScore > 72 ? "green" : liveScore > 52 ? "blue" : "amber"
    },
    {
      label: "Places filling up",
      value: String(highDemand),
      detail: "These are the spots seeing the most activity right now.",
      tone: highDemand > 3 ? "rose" : highDemand > 1 ? "amber" : "green"
    },
    {
      label: "Getting around",
      value: `${Math.round(averageReliability)}%`,
      detail: "How reliably buses and taxis are running across the city.",
      tone: averageReliability > 78 ? "green" : averageReliability > 64 ? "blue" : "amber"
    }
  ];
}

const pulseCache = new Map<string, { expiresAt: number; data: ExperiencePulseDTO }>();
const pulseCacheTtlMs = Number(process.env.PULSE_CACHE_TTL_MS ?? 30_000);

function stablePulseKey(input: PulseInput) {
  return JSON.stringify({
    city: input.city ?? "",
    vibe: input.vibe ?? "",
    dayPart: input.dayPart ?? "",
    location: input.location ? `${input.location.lat.toFixed(3)},${input.location.lng.toFixed(3)}` : ""
  });
}

export function generateExperiencePulse(input: PulseInput = {}): ExperiencePulseDTO {
  const cacheKey = stablePulseKey(input);
  const cached = pulseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const requestedCity = input.city?.trim() || "Prishtina";
  const allKosovoMode = requestedCity === ALL_KOSOVO_CITY;
  const city = allKosovoMode ? ALL_KOSOVO_PULSE_CITY : requestedCity;
  const cityPlaces = allKosovoMode ? places : places.filter((place) => place.city.toLowerCase() === city.toLowerCase());
  const candidates = cityPlaces.length ? cityPlaces : places;
  const zones = buildZones(input, candidates);
  const liveScore = zones.length
    ? zones.reduce((total, zone) => total + zone.intensity, 0) / zones.length
    : 0;
  const cityTransport = allKosovoMode
    ? transportPoints
    : transportPoints.filter((point) => point.city.toLowerCase() === city.toLowerCase());
  const sortedTransport = [...cityTransport].sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  const result: ExperiencePulseDTO = {
    city,
    generatedAt: new Date().toISOString(),
    liveScore: Math.round(liveScore),
    crowdMode: crowdMode(liveScore),
    topVibes: buildTopVibes(candidates),
    zones,
    insights: buildInsights(zones, liveScore, cityTransport),
    supplyGaps: buildSupplyGaps(candidates),
    suggestedActions: [
      `Give ${zones[0]?.title ?? city} a bit more prominence in today's picks.`,
      `Lead with ${cityTransport.length ? "transit-friendly" : "taxi-first"} travel advice for ${city}.`,
      "Let business owners know which moods are in demand but under-served.",
      "Keep an eye on whether the busiest places still match what people came for."
    ],
    transportHealth: {
      averageReliability: Math.round(averageTransportReliability(cityTransport)),
      bestPoint: sortedTransport[0]?.name,
      weakestPoint: sortedTransport.at(-1)?.name
    },
    methodology: [
      "We combine how popular a place is, how well it's reviewed, what's on nearby, and how easy it is to reach.",
      "Places that locals love but visitors tend to miss get extra weight, so the list isn't only the obvious names.",
      "Paid visibility is capped, so it can never outrank somewhere people genuinely enjoy."
    ]
  };

  pulseCache.set(cacheKey, { expiresAt: Date.now() + pulseCacheTtlMs, data: result });

  return result;
}
