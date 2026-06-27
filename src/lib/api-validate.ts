import { ZodTypeAny, z } from "zod";

import { fail } from "@/lib/api-response";
import { timeStep } from "@/lib/performance";

export type ValidateResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Response };

export async function validateBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
  errorMessage = "Invalid request payload."
): Promise<ValidateResult<z.infer<S>>> {
  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => schema.safeParse(body));

  if (!parsed.success) {
    return { ok: false, error: fail(errorMessage, 422, parsed.error.flatten()) };
  }

  return { ok: true, data: parsed.data };
}

export async function validateQuery<S extends ZodTypeAny>(
  request: Request,
  schema: S,
  errorMessage = "Invalid query parameters."
): Promise<ValidateResult<z.infer<S>>> {
  const { searchParams } = new URL(request.url);
  const parsed = await timeStep("validate", () => schema.safeParse(Object.fromEntries(searchParams.entries())));

  if (!parsed.success) {
    return { ok: false, error: fail(errorMessage, 422, parsed.error.flatten()) };
  }

  return { ok: true, data: parsed.data };
}