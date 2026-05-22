import { fail, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/permissions";
import { timeStep, withApiTiming } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { businessOnboardingSchema } from "@/lib/validation";

export const POST = withApiTiming("POST /api/businesses/onboarding", async function POST(request: Request) {
  const session = await timeStep("auth.requireRole", () => requireRole(["BUSINESS_OWNER", "ADMIN"]));

  if (!session) {
    return fail("Only business owners can create business profiles.", 403);
  }

  const body = await timeStep("request.json", () => request.json().catch(() => null));
  const parsed = await timeStep("validate", () => businessOnboardingSchema.safeParse(body));

  if (!parsed.success) {
    return fail("Invalid business onboarding payload.", 422, parsed.error.flatten());
  }

  if (!process.env.DATABASE_URL) {
    return ok({
      status: "PENDING",
      slug: slugify(parsed.data.name),
      message: "Prototype accepted profile. Connect PostgreSQL to persist onboarding."
    });
  }

  const category = await timeStep("category.findBySlug", () =>
    prisma.category.findUnique({ where: { slug: parsed.data.categorySlug } })
  );

  if (!category) {
    return fail("Category not found.", 404);
  }

  const businessSlug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  const placeSlug = `${slugify(parsed.data.name)}-place-${Date.now().toString(36)}`;
  const business = await timeStep("business.create", () =>
    prisma.business.create({
      data: {
        ownerId: session.user.id,
        name: parsed.data.name,
        slug: businessSlug,
        description: parsed.data.description,
        city: parsed.data.city,
        address: parsed.data.address,
        status: "PENDING",
        contact: {
          phone: parsed.data.phone,
          instagram: parsed.data.instagram
        },
        analytics: {
          monthlyViews: 0,
          saves: 0,
          routeRequests: 0
        },
        places: {
          create: {
            categoryId: category.id,
            title: parsed.data.name,
            slug: placeSlug,
            description: parsed.data.description,
            city: parsed.data.city,
            address: parsed.data.address,
            latitude: 42.6629,
            longitude: 21.1655,
            vibeTags: parsed.data.vibeTags,
            atmosphereTags: [],
            transportation: {
              walkingFriendly: true,
              taxiMinutes: 8,
              busAvailable: true
            }
          }
        }
      },
      include: { places: true }
    })
  );

  return ok({ business }, { status: 201 });
});
