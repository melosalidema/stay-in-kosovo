import { fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { answerTravelQuestion } from "@/services/assistant-engine";

export const POST = withApiTiming("POST /api/assistant", async function POST(request: Request) {
  const limited = rateLimit(getClientKey(request, "assistant"), 30, 60_000);

  if (!limited.allowed) {
    return fail("Assistant rate limit reached.", 429);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));

  if (!body?.message || typeof body.message !== "string") {
    return fail("Assistant message is required.", 422);
  }

  return ok(await timeStep("assistant.answer", () => answerTravelQuestion(body.message, body.context)));
});
