import { z } from "zod";

import { isCoordinateInsideKosovo } from "@/lib/geo";

const httpUrl = z.string().url().refine((val) => {
  try {
    const url = new URL(val);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "URL must use http or https protocol.");

export const coordinatesSchema = z
  .object({
    lat: z.number(),
    lng: z.number()
  })
  .refine((coordinates) => isCoordinateInsideKosovo(coordinates), "Coordinates must be numeric and inside Kosovo.");

export const placeFilterSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  vibe: z.string().optional(),
  budget: z.coerce.number().min(1).max(5).optional(),
  openNow: z.coerce.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  transport: z.string().optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().min(1).max(100).default(50)
});

export const recommendationSchema = z.object({
  userId: z.string().optional(),
  vibes: z.array(z.string()).min(1).default(["Hidden Gems"]),
  city: z.string().optional(),
  budget: z.number().min(1).max(5).optional(),
  location: coordinatesSchema.optional(),
  transportPreference: z.enum(["WALKING", "TAXI", "BUS", "BIKE", "CAR"]).optional(),
  openNow: z.boolean().optional(),
  dayPart: z.enum(["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"]).optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  avoidCrowds: z.boolean().optional(),
  accessibilityRequired: z.boolean().optional(),
  limit: z.number().min(1).max(20).default(6)
});

export const itinerarySchema = z.object({
  userId: z.string().optional(),
  title: z.string().optional(),
  city: z.string().min(2),
  budget: z.number().min(10).max(1000),
  durationHours: z.number().min(2).max(240),
  durationDays: z.number().int().min(1).max(14).optional(),
  interests: z.array(z.string()).min(1),
  vibe: z.string().min(2),
  transportPreference: z.enum(["WALKING", "TAXI", "BUS", "BIKE", "CAR"]),
  location: coordinatesSchema.optional()
});

export const mobilitySchema = z.object({
  from: coordinatesSchema,
  to: coordinatesSchema,
  preference: z.enum(["WALKING", "TAXI", "BUS", "BIKE", "CAR"]).optional(),
  city: z.string().optional()
});

export const reviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(8).max(1200),
  atmosphereTags: z.array(z.string()).max(8).default([]),
  crowdLevel: z.string().min(2),
  musicVibe: z.string().optional(),
  localPopularity: z.string().optional(),
  photos: z.array(httpUrl).default([])
});

export const businessOnboardingSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  city: z.string().min(2),
  address: z.string().min(4),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  categorySlug: z.string().min(2),
  vibeTags: z.array(z.string()).default([]),
  phone: z.string().optional(),
  instagram: z.string().optional()
}).refine((data) => isCoordinateInsideKosovo({ lat: data.latitude, lng: data.longitude }), {
  message: "Business coordinates must be numeric and inside Kosovo.",
  path: ["latitude"]
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const pulseSchema = z.object({
  city: z.string().optional(),
  vibe: z.string().optional(),
  dayPart: z.enum(["MORNING", "AFTERNOON", "EVENING", "LATE_NIGHT"]).optional(),
  location: coordinatesSchema.optional()
});

export const interactionSchema = z.object({
  type: z.enum(["VIEW", "SAVE", "REVIEW", "CHECK_IN", "SHARE", "ROUTE_REQUEST", "ITINERARY_ADD"]),
  placeId: z.string().optional(),
  eventId: z.string().optional(),
  city: z.string().optional(),
  vibe: z.string().optional(),
  weight: z.number().min(0.1).max(5).optional(),
  metadata: z
    .object({
      transportPreference: z.enum(["WALKING", "TAXI", "BUS", "BIKE", "CAR"]).optional()
    })
    .refine((obj) => Object.keys(obj).length <= 5, {
      message: "Metadata must have at most 5 keys."
    })
    .optional()
});
