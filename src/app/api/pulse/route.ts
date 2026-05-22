import { cacheHeaders, fail, ok } from "@/lib/api-response";
import { timeStep, withApiTiming } from "@/lib/performance";
import { pulseSchema } from "@/lib/validation";
import { generateExperiencePulse } from "@/services/pulse-engine";

export const GET = withApiTiming("GET /api/pulse", async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = await timeStep("validate", () => pulseSchema.safeParse(Object.fromEntries(searchParams.entries())));

  if (!parsed.success) {
    return fail("Invalid pulse filters.", 422, parsed.error.flatten());
  }

  return ok(await timeStep("pulse.generate", () => generateExperiencePulse(parsed.data)), { headers: cacheHeaders(30) });
});

export const POST = withApiTiming("POST /api/pulse", async function POST(request: Request) {
  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => pulseSchema.safeParse(body ?? {}));

  if (!parsed.success) {
    return fail("Invalid pulse request.", 422, parsed.error.flatten());
  }

  return ok(await timeStep("pulse.generate", () => generateExperiencePulse(parsed.data)));
});
