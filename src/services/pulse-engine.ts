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
  if (intensity >= 90) return `${place.title} is a high-signal stop right now with strong social and route demand.`;
  if (place.hiddenGemScore >= 68) return `${place.title} is trending as a hidden-gem option with lower mainstream density.`;
  return `${place.title} is a stable match with reliable quality and manageable mobility.`;
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
            ? `Recruit or boost more ${item.vibe.toLowerCase()} inventory in this city.`
            : `Current ${item.vibe.toLowerCase()} supply is healthy but should be monitored.`
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
      label: "City pulse",
      value: `${Math.round(liveScore)}/100`,
      detail: "Weighted by demand, quality, hidden gems, events, and mobility reliability.",
      tone: liveScore > 72 ? "green" : liveScore > 52 ? "blue" : "amber"
    },
    {
      label: "High-demand zones",
      value: String(highDemand),
      detail: "Places that should get more route, staffing, or moderation attention.",
      tone: highDemand > 3 ? "rose" : highDemand > 1 ? "amber" : "green"
    },
    {
      label: "Transport reliability",
      value: `${Math.round(averageReliability)}%`,
      detail: "Simulated public and taxi point reliability for route recommendations.",
      tone: averageReliability > 78 ? "green" : averageReliability > 64 ? "blue" : "amber"
    }
  ];
}

export function generateExperiencePulse(input: PulseInput = {}): ExperiencePulseDTO {
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

  return {
    city,
    generatedAt: new Date().toISOString(),
    liveScore: Math.round(liveScore),
    crowdMode: crowdMode(liveScore),
    topVibes: buildTopVibes(candidates),
    zones,
    insights: buildInsights(zones, liveScore, cityTransport),
    supplyGaps: buildSupplyGaps(candidates),
    suggestedActions: [
      `Prioritize ${zones[0]?.title ?? city} in the recommendation carousel for the next demand cycle.`,
      `Show ${cityTransport.length ? "transit-aware" : "taxi-first"} mobility messaging for ${city}.`,
      "Send business owners supply-gap prompts for underrepresented high-demand vibes.",
      "Use review atmosphere tags to validate whether boosted places still match the selected vibe."
    ],
    transportHealth: {
      averageReliability: Math.round(averageTransportReliability(cityTransport)),
      bestPoint: sortedTransport[0]?.name,
      weakestPoint: sortedTransport.at(-1)?.name
    },
    methodology: [
      "Blend place popularity, hidden-gem score, review quality, event heat, transport reliability, selected vibe, and day-part fit.",
      "Expose deterministic scores for auditability; OpenAI can later turn the score breakdown into natural language.",
      "Keep business boost separated from organic quality so paid visibility cannot dominate poor user experience."
    ]
  };
}
