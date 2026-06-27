import { cacheHeaders, ok } from "@/lib/api-response";
import { validateBody, validateQuery } from "@/lib/api-validate";
import { timeStep, withApiTiming } from "@/lib/performance";
import { pulseSchema } from "@/lib/validation";
import { generateExperiencePulse } from "@/services/pulse-engine";

export const GET = withApiTiming("GET /api/pulse", async function GET(request: Request) {
  const parsed = await validateQuery(request, pulseSchema, "Invalid pulse filters.");

  if (!parsed.ok) return parsed.error;

  return ok(await timeStep("pulse.generate", () => generateExperiencePulse(parsed.data)), { headers: cacheHeaders(30) });
});

export const POST = withApiTiming("POST /api/pulse", async function POST(request: Request) {
  const parsed = await validateBody(request, pulseSchema, "Invalid pulse request.");

  if (!parsed.ok) return parsed.error;

  return ok(await timeStep("pulse.generate", () => generateExperiencePulse(parsed.data)));
});