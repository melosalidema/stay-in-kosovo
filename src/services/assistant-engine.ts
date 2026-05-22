import { recommendPlaces } from "@/services/recommendation-engine";
import type { RecommendationInput } from "@/types";

export function answerTravelQuestion(message: string, context?: Partial<RecommendationInput>) {
  const lowered = message.toLowerCase();
  const vibe = lowered.includes("night")
    ? "Nightlife"
    : lowered.includes("food")
      ? "Local Food"
      : lowered.includes("mountain") || lowered.includes("nature")
        ? "Adventure"
        : context?.vibes?.[0] ?? "Hidden Gems";

  const city = lowered.includes("prizren")
    ? "Prizren"
    : lowered.includes("peja")
      ? "Peja"
      : lowered.includes("brezovica")
        ? "Brezovica"
        : context?.city ?? "Prishtina";

  const recommendations = recommendPlaces({
    vibes: [vibe],
    city,
    budget: context?.budget ?? 3,
    limit: 3,
    transportPreference: context?.transportPreference
  });

  const picks = recommendations.map((item) => item.place.title).join(", ");

  return {
    answer: `For ${city}, I would start with ${picks}. The strongest signal is ${vibe.toLowerCase()}, then I would check mobility so the plan stays realistic.`,
    recommendations
  };
}
