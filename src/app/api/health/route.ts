import { ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { generateExperiencePulse } from "@/services/pulse-engine";
import { explainRecommendationSystem } from "@/services/recommendation-engine";

export const GET = withApiTiming("GET /api/health", async function GET() {
  return ok({
    status: "healthy",
    app: "Stay in Kosovo",
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    recommendationEngine: await timeStep("recommendations.explain", () => explainRecommendationSystem()),
    pulseEngine: {
      sample: (await timeStep("pulse.sample", () => generateExperiencePulse({ city: "Prishtina", dayPart: "EVENING" }))).liveScore,
      role: "Feeds live-demand context into recommendations, itinerary timing, mobility messaging, and business supply prompts."
    }
  });
});
