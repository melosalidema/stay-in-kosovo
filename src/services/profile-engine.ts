import { clamp } from "@/lib/utils";
import type { InteractionInput, PlaceDTO, PreferenceProfile, TransportMethod } from "@/types";

const interactionWeights: Record<InteractionInput["type"], number> = {
  VIEW: 0.4,
  SAVE: 1.4,
  REVIEW: 1.8,
  CHECK_IN: 2,
  SHARE: 1.1,
  ROUTE_REQUEST: 0.9,
  ITINERARY_ADD: 1.5
};

const emptyMobilityBias: Partial<Record<TransportMethod, number>> = {
  WALKING: 0,
  TAXI: 0,
  BUS: 0,
  BIKE: 0,
  CAR: 0
};

export const defaultPreferenceProfile: PreferenceProfile = {
  preferredVibes: {
    "Hidden Gems": 0.72,
    "Local Food": 0.64,
    Chill: 0.42
  },
  preferredCities: {
    Prishtina: 0.62,
    Prizren: 0.48
  },
  preferredCategories: {
    restaurants: 0.58,
    cafes: 0.52,
    culture: 0.44
  },
  averageBudget: 3,
  mobilityBias: {
    ...emptyMobilityBias,
    WALKING: 0.68,
    BUS: 0.36
  },
  hiddenGemAffinity: 0.7
};

function addSignal(record: Record<string, number>, key: string | undefined, weight: number) {
  if (!key) return;
  record[key] = clamp((record[key] ?? 0) + weight, 0, 3);
}

export function buildPreferenceProfile(interactions: InteractionInput[], places: PlaceDTO[]): PreferenceProfile {
  const profile: PreferenceProfile = {
    preferredVibes: {},
    preferredCities: {},
    preferredCategories: {},
    averageBudget: defaultPreferenceProfile.averageBudget,
    mobilityBias: { ...emptyMobilityBias },
    hiddenGemAffinity: 0.45
  };

  let budgetTotal = 0;
  let budgetSamples = 0;
  let hiddenGemTotal = 0;

  interactions.forEach((interaction) => {
    const place = places.find((item) => item.id === interaction.placeId || item.slug === interaction.placeId);
    const weight = interaction.weight ?? interactionWeights[interaction.type] ?? 0.5;

    addSignal(profile.preferredCities, interaction.city ?? place?.city, weight);
    addSignal(profile.preferredCategories, place?.category.slug, weight);
    addSignal(profile.preferredVibes, interaction.vibe, weight);

    place?.vibeTags.forEach((vibe) => addSignal(profile.preferredVibes, vibe, weight / 2));

    if (place) {
      budgetTotal += place.priceLevel * weight;
      budgetSamples += weight;
      hiddenGemTotal += (place.hiddenGemScore / 100) * weight;
    }

    const transport = interaction.metadata?.transportPreference;
    if (typeof transport === "string" && transport in emptyMobilityBias) {
      profile.mobilityBias[transport as TransportMethod] = clamp(
        (profile.mobilityBias[transport as TransportMethod] ?? 0) + weight / 3,
        0,
        2
      );
    }
  });

  if (budgetSamples > 0) {
    profile.averageBudget = Number(clamp(budgetTotal / budgetSamples, 1, 5).toFixed(1));
    profile.hiddenGemAffinity = Number(clamp(hiddenGemTotal / budgetSamples, 0, 1).toFixed(2));
  }

  return profile;
}

export function scorePlaceForProfile(place: PlaceDTO, profile?: PreferenceProfile) {
  if (!profile) return 0.5;

  const vibeScore =
    place.vibeTags.reduce((total, vibe) => total + (profile.preferredVibes[vibe] ?? 0), 0) /
    Math.max(place.vibeTags.length, 1);
  const cityScore = profile.preferredCities[place.city] ?? 0;
  const categoryScore = profile.preferredCategories[place.category.slug] ?? 0;
  const budgetFit = clamp(1 - Math.abs(place.priceLevel - profile.averageBudget) * 0.18, 0.2, 1);
  const noveltyFit = clamp(1 - Math.abs(place.hiddenGemScore / 100 - profile.hiddenGemAffinity), 0.2, 1);

  return clamp(vibeScore * 0.3 + cityScore * 0.18 + categoryScore * 0.18 + budgetFit * 0.2 + noveltyFit * 0.14, 0, 1.25);
}
