import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { csrfProtect } from "@/lib/csrf";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { answerTravelQuestion } from "@/services/assistant-engine";

export const POST = withApiTiming("POST /api/assistant", async function POST(request: Request) {
  const csrfError = await csrfProtect(request);
  if (csrfError) return csrfError;

  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user) {
    return fail("Authentication required.", 401);
  }

  const limited = await rateLimit(getClientKey(request, "assistant"), 30, 60_000);

  if (!limited.allowed) {
    return fail("Assistant rate limit reached.", 429);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));

  if (!body?.message || typeof body.message !== "string" || body.message.length > 2000) {
    return fail("Assistant message is required (max 2000 characters).", 422);
  }

  const context = body.context;
  const sanitizedContext = context && typeof context === "object"
    ? {
        vibes: Array.isArray(context.vibes) ? context.vibes.filter((v: unknown) => typeof v === "string").slice(0, 5) : [],
        city: typeof context.city === "string" ? context.city.slice(0, 50) : undefined,
        budget: typeof context.budget === "number" ? Math.min(Math.max(context.budget, 1), 5) : undefined,
        transportPreference: typeof context.transportPreference === "string" ? context.transportPreference.slice(0, 10) : undefined
      }
    : {};

  return ok(await timeStep("assistant.answer", () => answerTravelQuestion(body.message.slice(0, 2000), sanitizedContext)));
});
