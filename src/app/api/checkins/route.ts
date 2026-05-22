import { Prisma } from "@prisma/client";

import { fail, ok } from "@/lib/api-response";
import { getCurrentSession } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";

export const POST = withApiTiming("POST /api/checkins", async function POST(request: Request) {
  const body = await timeStep("request.json", () => request.json().catch(() => null));

  if (!body?.businessId || !body?.qrCode) {
    return fail("businessId and qrCode are required.", 422);
  }

  const session = await timeStep("auth.session", () => getCurrentSession());

  if (!process.env.DATABASE_URL) {
    return ok({
      accepted: true,
      badgeProgress: "Route Master +1",
      qrCode: body.qrCode
    });
  }

  const checkIn = await timeStep("checkin.create", () =>
    prisma.businessCheckIn.create({
      data: {
        businessId: body.businessId,
        userId: session?.user?.id,
        qrCode: body.qrCode,
        value: new Prisma.Decimal(body.value ?? 0)
      }
    })
  );

  return ok({ checkIn }, { status: 201 });
});
