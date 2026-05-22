# Stay in Kosovo - Smart Experience & Mobility App

Production-style Next.js prototype for a Kosovo-focused tourism, mobility, AI itinerary, business onboarding, local experience, and city intelligence platform.

This version is a V2 product direction rather than a copy of the earlier prototype. The core idea is an "experience operating system": discovery, vibe recommendations, route planning, business supply, reviews, and admin moderation all feed a live pulse layer that can guide tourists, locals, and operators.

## What Is Built

- Mobile-first Next.js 15 App Router frontend
- REST API routes for places, recommendations, city pulse, interaction tracking, mobility, itinerary generation, reviews, business onboarding, admin moderation, uploads, weather, and assistant chat
- Prisma PostgreSQL schema with users, roles, businesses, places, reviews, itineraries, events, vibes, categories, saved places, transportation, interactions, badges, and check-ins
- NextAuth credentials auth plus optional Google OAuth
- Zustand state for selected vibe, filters, user location, saved places, and itinerary draft
- Deterministic simulated AI recommendation engine with explainable scoring, context weighting, and interaction-profile personalization
- Experience pulse engine that scores city demand zones, top vibes, transport health, and business supply gaps
- Mobility engine with ETA, cost, carbon score, and transport availability simulation
- Cloudinary signature endpoint, Open-Meteo weather integration, and Mapbox-ready map UI
- Dockerfile and docker-compose for Postgres and production web runtime
- Vitest tests and HTTP API examples

## Architecture Summary

The app uses Next.js as the full-stack boundary. UI pages live in `src/app`, reusable UI and feature components live in `src/components`, domain logic lives in `src/services`, shared helpers live in `src/lib`, typed DTOs live in `src/types`, Prisma data modeling lives in `prisma`, and local fallback data lives in `src/data`.

Major architectural decisions:

- Next.js App Router keeps frontend routes, API handlers, SSR, and deployment in one app while still separating business logic into services.
- API routes validate with Zod first, then call services. This keeps request parsing, authorization, and business logic separate.
- Prisma is the persistence layer for users, sessions, businesses, places, reviews, itineraries, events, saved places, transport points, interactions, badges, and check-ins.
- Zustand owns client-only preference state: selected vibe, discovery filters, user location, saved place IDs, and itinerary draft.
- NextAuth uses JWT sessions with role fields. Middleware protects business/admin surfaces, and server helpers protect API routes.
- The AI layer is deterministic in the prototype so ranking remains auditable. OpenAI can later generate natural-language explanations and chat responses on top of the score breakdown.

Data flow:

1. User opens the app and the shell loads session, navigation, offline banner, and assistant.
2. Home requests location through `useGeolocation`.
3. Vibe selection updates the Zustand store.
4. Home and `/pulse` call `/api/pulse`, which scores live city demand zones from places, events, transport reliability, selected vibe, and day part.
5. Recommendation components call `/api/recommendations`.
6. API validates with Zod, fetches places from PostgreSQL or fallback data, builds a preference profile from recent interactions when signed in, then calls `recommendPlaces`.
7. Discovery cards send `/api/interactions` events for views and saves. In database mode these become `UserInteraction` rows.
8. Mobility requests call `/api/mobility`, which returns route options and simulated transport points.
9. Itinerary requests call `/api/itinerary`, which combines recommendation ranking with city pulse context, calculates route segments, and optionally saves the generated plan.
10. Business views, route requests, reviews, saves, and check-ins feed analytics, profile learning, badge progress, and future supply recommendations.

## Folder Structure

```txt
prisma/
  schema.prisma          Database models, enums, indexes, and relations
  seed.ts                Kosovo-focused users, businesses, places, events, reviews
public/
  manifest.webmanifest   PWA metadata
  sw.js                  Small offline service worker
src/app/
  page.tsx               Landing experience
  pulse/                 City pulse console
  discover/              Discovery and reviews
  itinerary/             AI itinerary builder
  mobility/              Smart mobility panel
  business/              Business dashboard and onboarding
  admin/                 Moderation console
  auth/                  Login and register screens
  api/                   REST route handlers
src/components/
  ui/                    ShadCN-style primitives
  home/                  Hero, pulse command center, vibe selector, recommendations, trends
  pulse/                 Demand-zone console and supply-gap UI
  discovery/             Filters, cards, map panel
  itinerary/             Itinerary builder UI
  mobility/              Route comparison UI
  business/              Dashboard and onboarding
  admin/                 Admin console
  assistant/             AI travel assistant
src/services/
  recommendation-engine.ts  Explainable AI scoring
  profile-engine.ts         Interaction-profile personalization
  pulse-engine.ts           City demand, supply-gap, and transport-health intelligence
  interaction-service.ts    View/save/review/check-in/share event capture
  itinerary-engine.ts       Timeline and route generation
  mobility-engine.ts        ETA/cost/transport simulation
  place-service.ts          Prisma-first, fallback-safe data access
  weather-service.ts        Open-Meteo integration
  upload-service.ts         Cloudinary signature helper
src/lib/
  auth/                  NextAuth options and role helpers
  prisma.ts              Prisma singleton
  validation.ts          Zod DTO validation
  rate-limit.ts          In-memory API limiter
src/store/
  app-store.ts           Zustand UI state
src/__tests__/
  *.test.ts(x)           Recommendation, profile, pulse, mobility, itinerary, component tests
```

## Backend Logic

The API layer follows the same lifecycle everywhere:

1. Read query/body.
2. Validate with `src/lib/validation.ts`.
3. Apply role protection or rate limiting when needed.
4. Fetch database rows through Prisma services or use Kosovo fallback data when PostgreSQL is unavailable.
5. Return a normalized DTO through `ok()` or `fail()` from `src/lib/api-response.ts`.

Important endpoints:

- `GET /api/places` filters discovery inventory by query, city, category, vibe, budget, open status, rating, transport, and limit.
- `POST /api/recommendations` ranks places by vibe, distance, budget, quality, hidden-gem signal, mobility, business boost, day-part context, and learned preference profile.
- `GET /api/pulse` returns city live score, demand zones, top vibes, supply gaps, transport health, and operator actions.
- `POST /api/interactions` accepts view/save/review/check-in/share/route/itinerary events and stores them when a database is connected.
- `POST /api/mobility` compares walking, taxi, bus, bike, and car with ETA, cost, availability, carbon score, and route points.
- `POST /api/itinerary` generates a timeline with stops, route segments, costs, travel time, and AI rationale.
- `POST /api/businesses/onboarding` creates pending business profiles and linked places for approval.
- `GET /api/admin/moderation` exposes protected moderation queues.

## AI And Pulse Logic

`src/services/recommendation-engine.ts` is intentionally auditable. The current weights are:

- Vibe fit: 24%
- Distance: 12%
- Budget: 10%
- Quality: 16%
- Hidden-gem novelty: 12%
- Mobility fit: 10%
- Business boost: 4%
- Context: 6%
- Personalization: 6%

`src/services/profile-engine.ts` turns interaction events into a profile: preferred vibes, preferred cities, preferred categories, average budget, mobility bias, and hidden-gem affinity. In production, this can become an embedding/vector profile updated asynchronously.

`src/services/pulse-engine.ts` produces live city intelligence. It blends place popularity, hidden-gem score, review quality, event heat, transport reliability, selected vibe, and day-part fit. This powers the home command center, `/pulse`, itinerary rationale, and future business supply prompts.

## Database Relations

The Prisma schema models a marketplace:

- `User` has auth accounts, sessions, businesses, reviews, saved places, itineraries, interactions, check-ins, and badges.
- `Business` belongs to a business owner and can own places/events/check-ins.
- `Place` belongs to a category and optionally a business; it has reviews, saves, itinerary stops, events, interactions, and transport hubs.
- `Review` captures rating plus structured atmosphere/crowd/music/local popularity data.
- `Itinerary` has ordered `ItineraryStop` rows and optional user ownership.
- `Event`, `Vibe`, `Category`, `SavedPlace`, `TransportationPoint`, `UserInteraction`, `BusinessCheckIn`, and `Badge` provide discovery, personalization, mobility, analytics, and gamification data.

Indexes exist on role, ownership, city/open status, rating, popularity, location, event city/date, review status, interactions, and transport city/type so the first production scaling path is clear. For larger datasets, add PostGIS, cursor pagination, Redis caching, and background analytics aggregation.

## Setup

```bash
cd /mnt/c/Users/Admin/Downloads/Stay-in-Kosovo-App
cp .env.example .env
npm install
```

Generate Prisma client:

```bash
npm run db:generate
```

Start PostgreSQL with Docker:

```bash
docker compose up -d db
```

Create tables and seed realistic Kosovo data:

```bash
npm run db:migrate -- --name init
npm run db:seed
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Seeded Accounts

All seeded accounts use:

```txt
Password123!
```

- Tourist: `tourist@staykosovo.dev`
- Business owner: `owner@staykosovo.dev`
- Admin: `admin@staykosovo.dev`

## Useful Commands

```bash
npm run dev          # local development
npm run build        # production build
npm run start        # production server
npm run typecheck    # TypeScript verification
npm run lint         # Next/ESLint checks
npm run test         # Vitest tests
npm run db:studio    # Prisma Studio
npm run docker:up    # build and run app + database
```

## Environment Variables

Required for full database/auth runtime:

```txt
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
```

Optional integrations:

```txt
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_MAPBOX_TOKEN
OPENAI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The app remains usable without external API keys by using deterministic AI, a Mapbox fallback map, mock upload behavior, and cached/weather fallback behavior.

## Testing

Run:

```bash
npm run test
```

API examples are in:

```txt
tests/api.http
```

These can be used from VS Code REST Client or similar tools.

Current verification commands used for this build:

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deployment

1. Provision PostgreSQL.
2. Set production env vars.
3. Run `npx prisma migrate deploy`.
4. Build with `npm run build`.
5. Start with `npm run start`.

Docker path:

```bash
cp .env.example .env
docker compose up --build
```

## Scaling Notes

- Replace fallback maps with Mapbox Directions and Tiles when a token is available.
- Move rate limiting from memory to Redis for multi-instance deployments.
- Add PostGIS for true distance queries and location indexing.
- Use Redis or Vercel cache tags for place/recommendation caching.
- Move pulse calculations to scheduled jobs or stream processors fed by interactions, check-ins, events, weather, and mobility data.
- Store per-user preference vectors and per-place embeddings for hybrid collaborative/content recommendations.
- Stream OpenAI responses for chat and itinerary narrative generation.
- Add background jobs for analytics aggregation and moderation classification.
- Add file scanning and signed upload policies for production media safety.
