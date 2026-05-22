import { places as fallbackPlaces, vibes } from "@/data/kosovo-data";
import { clamp } from "@/lib/utils";
import { distanceKm } from "@/services/mobility-engine";
import { scorePlaceForProfile } from "@/services/profile-engine";
import type { PlaceDTO, RecommendationInput, RecommendationResult } from "@/types";

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function vibeWeight(vibe: string) {
  return vibes.find((item) => item.name === vibe || item.slug === normalizeText(vibe).replace(/\s+/g, "-"))?.weight ?? 1;
}

function scoreVibes(inputVibes: string[], place: PlaceDTO) {
  if (!inputVibes.length) return 0.4;

  const normalized = inputVibes.map(normalizeText);
  const matches = place.vibeTags.filter((tag) => normalized.includes(normalizeText(tag)));
  const weighted = matches.reduce((total, tag) => total + vibeWeight(tag), 0);

  return clamp(weighted / Math.max(inputVibes.length, 1), 0, 1.4);
}

function scoreDistance(input: RecommendationInput, place: PlaceDTO) {
  if (!input.location) return 0.66;

  const distance = distanceKm(input.location, place.coordinates);
  return clamp(1 - distance / 65, 0.05, 1);
}

function scoreBudget(input: RecommendationInput, place: PlaceDTO) {
  if (!input.budget) return 0.7;
  if (place.priceLevel <= input.budget) return 1;
  return clamp(1 - (place.priceLevel - input.budget) * 0.22, 0.15, 1);
}

function scoreMobility(input: RecommendationInput, place: PlaceDTO) {
  if (input.transportPreference === "WALKING") return place.transportation.walkingFriendly ? 1 : 0.35;
  if (input.transportPreference === "BUS") return place.transportation.busAvailable ? 0.92 : 0.4;
  if (input.transportPreference === "TAXI") return place.transportation.taxiMinutes < 16 ? 0.88 : 0.65;
  return 0.72;
}

function scoreContext(input: RecommendationInput, place: PlaceDTO) {
  let score = 0.68;

  if (input.dayPart === "MORNING") {
    score += place.category.slug === "cafes" || place.vibeTags.includes("Adventure") ? 0.18 : 0;
    score -= place.vibeTags.includes("Nightlife") ? 0.16 : 0;
  }

  if (input.dayPart === "EVENING" || input.dayPart === "LATE_NIGHT") {
    score += place.vibeTags.includes("Nightlife") || place.vibeTags.includes("Romantic") ? 0.18 : 0;
    score -= place.category.slug === "parks" && input.dayPart === "LATE_NIGHT" ? 0.2 : 0;
  }

  if (input.partySize && input.partySize >= 4) {
    score += place.vibeTags.includes("Family Friendly") || place.transportation.parking === "easy" ? 0.12 : 0;
  }

  if (input.avoidCrowds && (place.crowdLevel === "Busy" || place.crowdLevel === "Lively")) {
    score -= 0.22;
  }

  if (input.accessibilityRequired) {
    score += place.accessibility?.wheelchairNotes ? 0.1 : -0.18;
  }

  return clamp(score, 0.1, 1.1);
}

function buildReasons(input: RecommendationInput, place: PlaceDTO, score: RecommendationResult["scoreBreakdown"]) {
  const reasons = [];
  const vibeMatch = place.vibeTags.find((tag) => input.vibes.map(normalizeText).includes(normalizeText(tag)));

  if (vibeMatch) reasons.push(`Strong ${vibeMatch} signal`);
  if (score.novelty > 0.68) reasons.push("Hidden-gem potential");
  if (score.mobility > 0.85) reasons.push("Easy mobility fit");
  if (score.context > 0.82) reasons.push("Good time-of-day and group fit");
  if (score.personalization > 0.72) reasons.push("Matches learned preference profile");
  if (place.rating >= 4.7) reasons.push("High review quality");
  if (place.business?.verified) reasons.push("Verified local business");

  return reasons.slice(0, 4);
}

export function recommendPlaces(input: RecommendationInput, candidates: PlaceDTO[] = fallbackPlaces): RecommendationResult[] {
  const filtered = candidates.filter((place) => {
    const cityMatch = !input.city || place.city.toLowerCase() === input.city.toLowerCase();
    const openMatch = input.openNow === undefined || place.openNow === input.openNow;
    return cityMatch && openMatch;
  });

  return filtered
    .map((place) => {
      const scoreBreakdown = {
        vibe: scoreVibes(input.vibes, place),
        distance: scoreDistance(input, place),
        budget: scoreBudget(input, place),
        quality: clamp(place.rating / 5 + place.popularityScore / 500, 0, 1.1),
        novelty: clamp(place.hiddenGemScore / 100, 0, 1),
        mobility: scoreMobility(input, place),
        businessBoost: clamp((place.business?.boostScore ?? 0) / 100, 0, 1),
        context: scoreContext(input, place),
        personalization: scorePlaceForProfile(place, input.interactionProfile)
      };

      const score =
        scoreBreakdown.vibe * 0.24 +
        scoreBreakdown.distance * 0.12 +
        scoreBreakdown.budget * 0.1 +
        scoreBreakdown.quality * 0.16 +
        scoreBreakdown.novelty * 0.12 +
        scoreBreakdown.mobility * 0.1 +
        scoreBreakdown.businessBoost * 0.04 +
        scoreBreakdown.context * 0.06 +
        scoreBreakdown.personalization * 0.06;

      return {
        place,
        score: Number((score * 100).toFixed(1)),
        reasons: buildReasons(input, place, scoreBreakdown),
        scoreBreakdown
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 6);
}

export function explainRecommendationSystem() {
  return {
    weights: {
      vibe: "24%",
      distance: "12%",
      budget: "10%",
      quality: "16%",
      hiddenGemNovelty: "12%",
      mobility: "10%",
      businessBoost: "4%",
      context: "6%",
      personalization: "6%"
    },
    personalization:
      "The prototype accepts explicit preferences and can blend an interaction profile built from views, saves, routes, reviews, and check-ins. In production, UserInteraction rows would update a per-user embedding/profile vector and tune the weights over time.",
    openAiUpgrade:
      "OpenAI can be used to transform ranked candidates into natural-language explanations, chat replies, and itinerary narratives while keeping deterministic scoring auditable."
  };
}
