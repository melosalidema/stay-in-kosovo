import { ok } from "@/lib/api-response";
import { getCsrfToken } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const csrfToken = await getCsrfToken();

  return ok({ csrfToken: csrfToken ?? "" });
}
