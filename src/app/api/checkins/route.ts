import { Prisma } from "@prisma/client";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { csrfProtect } from "@/lib/csrf";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";

const checkinSchema = z.object({
  businessId: z.string().min(1),
  qrCode: z.string().min(1).max(256),
  value: z.number().min(0).max(100000).optional().default(0)
});

export const POST = withApiTiming("POST /api/checkins", async function POST(request: Request) {
  const csrfError = await csrfProtect(request);
  if (csrfError) return csrfError;

  const rawBody = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = checkinSchema.safeParse(rawBody);

  if (!parsed.success) {
    return fail("Invalid check-in payload: businessId and qrCode are required.", 422);
  }

  const { businessId, qrCode, value } = parsed.data;
  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!process.env.DATABASE_URL) {
    return ok({
      accepted: true,
      badgeProgress: "Route Master +1",
      qrCode
    });
  }

  const checkIn = await timeStep("checkin.create", () =>
    prisma.businessCheckIn.create({
      data: {
        businessId,
        userId: session?.user?.id,
        qrCode,
        value: new Prisma.Decimal(value)
      }
    })
  );

  return ok({ checkIn }, { status: 201 });
});
