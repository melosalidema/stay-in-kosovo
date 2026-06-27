import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { createCloudinarySignature } from "@/services/upload-service";

export const GET = withApiTiming("GET /api/upload/signature", async function GET(request: Request) {
  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user) {
    return fail("Upload signatures require authentication.", 401);
  }

  const limited = await rateLimit(getClientKey(request, "upload-sig"), 10, 60_000);

  if (!limited.allowed) {
    return fail("Upload signature rate limit reached.", 429);
  }

  const userId = session.user.id;
  const folder = `stay-in-kosovo/${userId}`;

  return ok(await timeStep("upload.signature", () => createCloudinarySignature(folder)));
});
