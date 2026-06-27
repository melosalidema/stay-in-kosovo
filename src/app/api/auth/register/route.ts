import bcrypt from "bcryptjs";

import { fail, ok } from "@/lib/api-response";
import { validateBody } from "@/lib/api-validate";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export const POST = withApiTiming("POST /api/auth/register", async function POST(request: Request) {
  const limited = await rateLimit(getClientKey(request, "auth-register"), 8, 60_000);

  if (!limited.allowed) {
    return fail("Too many registration attempts. Please wait a moment.", 429);
  }

  const parsed = await validateBody(request, registerSchema, "Invalid registration payload.");

  if (!parsed.ok) return parsed.error;

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existing = await timeStep("user.findByEmail", () => prisma.user.findUnique({ where: { email: normalizedEmail } }));

  if (existing) {
    return fail("An account with this email already exists.", 409);
  }

  const hashedPassword = await timeStep("password.hash", () => bcrypt.hash(password, 12));
  const user = await timeStep("user.create", () =>
    prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        role: "USER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
  );

  return ok(user, { status: 201 });
});