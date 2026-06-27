import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { getCurrentSession } from "@/lib/auth/permissions";
import { csrfProtect } from "@/lib/csrf";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { interactionSchema } from "@/lib/validation";
import { trackInteraction } from "@/services/interaction-service";
import type { InteractionInput } from "@/types";

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
  const limited = await rateLimit(getClientKey(request, "interactions"), 120, 60_000);

  if (!limited.allowed) {
    return fail("Interaction rate limit reached.", 429);
  }

  const parsed = await validateBody(request, interactionSchema, "Invalid interaction payload.");

  if (!parsed.ok) return parsed.error;

  const session = hasSessionCookie(request) ? await timeStep("auth.session", () => getCurrentSession()) : null;

  if (parsed.data.type !== "VIEW" && !session?.user) {
    return fail("Authentication required for this interaction type.", 401);
  }

  if (parsed.data.type !== "VIEW" && session?.user) {
    const csrfError = await csrfProtect(request);
    if (csrfError) return csrfError;
  }

  const result = await timeStep("interaction.track", () => trackInteraction(parsed.data as InteractionInput, session?.user?.id));

  return ok(result, { status: result.persisted ? 201 : 202 });
});
