import OpenAI from "openai";

import { logger } from "@/lib/logger";
import { recommendPlaces } from "@/services/recommendation-engine";
import type { RecommendationInput } from "@/types";

const openaiModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;

  if (!key) return null;

  return new OpenAI({ apiKey: key });
}

function keywordAnswer(message: string, context?: Partial<RecommendationInput>) {
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

async function aiAnswer(message: string, context?: Partial<RecommendationInput>) {
  const client = getOpenAI();
  if (!client) return null;

  const vibe = context?.vibes?.[0] ?? "Hidden Gems";
  const city = context?.city ?? "Prishtina";
  const recommendations = recommendPlaces({
    vibes: [vibe],
    city,
    budget: context?.budget ?? 3,
    limit: 5,
    transportPreference: context?.transportPreference
  });

  const placesContext = recommendations
    .map(
      (r, i) =>
        `${i + 1}. ${r.place.title} (${r.place.city}, rating ${r.place.rating}, vibe tags: ${r.place.vibeTags.join(", ")}, score: ${r.score.toFixed(2)})`
    )
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: openaiModel,
      messages: [
        {
          role: "system",
          content: `You are a helpful Kosovo travel assistant. You provide concise, accurate recommendations based on the available places data.

Context about the user's preferences:
- City: ${city}
- Vibe: ${vibe}
- Budget level (1-5): ${context?.budget ?? 3}
- Transport: ${context?.transportPreference ?? "WALKING"}

Available ranked places:
${placesContext}

Respond in 2-3 sentences with specific recommendations. Be conversational and mention why each place fits their vibe.`
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const answer = response.choices[0]?.message?.content;

    return {
      answer: answer ?? "I could not generate a recommendation. Please try again.",
      recommendations
    };
  } catch (error) {
    logger.warn({ error }, "OpenAI assistant request failed, falling back to keyword mode");
    return null;
  }
}

export async function answerTravelQuestion(message: string, context?: Partial<RecommendationInput>) {
  const ai = await aiAnswer(message, context);

  if (ai) return ai;

  return keywordAnswer(message, context);
}
