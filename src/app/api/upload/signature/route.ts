import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { createCloudinarySignature } from "@/services/upload-service";

export const GET = withApiTiming("GET /api/upload/signature", async function GET() {
  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!session?.user) {
    return fail("Upload signatures require authentication.", 401);
  }

  return ok(await timeStep("upload.signature", () => createCloudinarySignature()));
});
