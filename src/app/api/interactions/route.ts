import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { interactionSchema } from "@/lib/validation";
import { trackInteraction } from "@/services/interaction-service";

function hasSessionCookie(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";

  return (
    cookie.includes("next-auth.session-token") ||
    cookie.includes("__Secure-next-auth.session-token") ||
    cookie.includes("authjs.session-token") ||
    cookie.includes("__Secure-authjs.session-token")
  );
}

export const POST = withApiTiming("POST /api/interactions", async function POST(request: Request) {
  const limited = rateLimit(getClientKey(request, "interactions"), 120, 60_000);

  if (!limited.allowed) {
    return fail("Interaction rate limit reached.", 429);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => interactionSchema.safeParse(body));

  if (!parsed.success) {
    return fail("Invalid interaction payload.", 422, parsed.error.flatten());
  }

  const session = hasSessionCookie(request) ? await timeStep("auth.session", () => getCurrentSession()) : null;
  const result = await timeStep("interaction.track", () => trackInteraction(parsed.data, session?.user?.id));

  return ok(result, { status: result.persisted ? 201 : 202 });
});
