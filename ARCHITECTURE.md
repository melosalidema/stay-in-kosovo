# Stay in Kosovo Architecture

## Product Architecture

Stay in Kosovo is split into six product surfaces:

1. Pulse: live city demand, vibe heat, mobility pressure, and business supply gaps.
2. Discovery: places, categories, vibes, search, maps, events, and reviews.
3. Mobility: ETA, method comparison, nearby transport points, and route visualization.
4. Itineraries: AI-ranked places converted into a timeline with stops, cost, and route segments.
5. Business: onboarding, profile health, boost score, events, analytics, media, and QR check-ins.
6. Admin: role-gated queues for business approval, review moderation, and location approval.

The product is designed so tourists, citizens, and businesses all feed the same experience graph. A save, review, route request, check-in, or itinerary add can become a `UserInteraction`, which later tunes recommendations and analytics.

## Backend Flow

Route handlers live in `src/app/api`.

Each route follows this lifecycle:

1. Read request.
2. Apply rate limiting when user input is involved.
3. Validate payload or query with Zod schemas from `src/lib/validation.ts`.
4. Resolve session/role when required through `src/lib/auth/permissions.ts`.
5. Call a service from `src/services`.
6. Return a consistent response through `ok()` or `fail()`.

This keeps API handlers thin. Recommendation math does not live in React components, and database access does not leak into UI components.

## Database Relations

Important relations:

- `User` has many `Business`, `Review`, `SavedPlace`, `Itinerary`, `UserInteraction`, `BusinessCheckIn`, and `UserBadge`.
- `Business` belongs to one owner and can expose many `Place` and `Event` rows.
- `Place` belongs to one `Category`, optionally one `Business`, and has many reviews, saved records, itinerary stops, events, and interactions.
- `Itinerary` has many ordered `ItineraryStop` rows.
- `TransportationPoint` models local bus/taxi/bike/car/walking availability.
- `BusinessCheckIn` links QR engagement to a business and optionally to a user.

Indexes are added around role, city, category, open status, rating, popularity, latitude/longitude, moderation status, and analytics-heavy relations. In production, location lookups should move to PostGIS with geospatial indexes.

## Recommendation Engine

`src/services/recommendation-engine.ts` implements an auditable scoring model.

Score inputs:

- Vibe match: selected vibe compared with place vibe tags.
- Distance: Haversine distance when user location is available.
- Budget: place price level against user budget.
- Quality: rating plus popularity.
- Novelty: hidden-gem score.
- Mobility: walking, bus, taxi, bike, or car fit.
- Business boost: capped boost from verified local business signals.
- Context: day part, party size, crowd avoidance, and accessibility needs.
- Personalization: profile generated from recent views, saves, routes, reviews, and check-ins.

Weights:

- Vibe: 24%
- Distance: 12%
- Budget: 10%
- Quality: 16%
- Hidden-gem novelty: 12%
- Mobility: 10%
- Business boost: 4%
- Context: 6%
- Personalization: 6%

This architecture is intentionally explainable. OpenAI can later summarize recommendations, generate natural-language reasons, and power chat, but the core ranking remains deterministic and testable.

## Pulse Engine

`src/services/pulse-engine.ts` is the V2 intelligence layer. It generates city-level operating signals from fallback data or future database/stream inputs.

Pulse inputs:

- city
- selected vibe
- day part
- place popularity and hidden-gem score
- review quality
- event heat
- transport point reliability

Pulse outputs:

- live score and crowd mode
- top vibes
- demand zones
- supply gaps
- suggested operator actions
- transport health
- methodology notes for auditability

The pulse API lives at `/api/pulse`. The home page uses it as a command-center preview and `/pulse` exposes a deeper console. In production, this calculation should move to scheduled jobs or a stream processor fed by `UserInteraction`, `BusinessCheckIn`, weather, events, and route requests.

## Personalization Flow

`src/services/interaction-service.ts` captures engagement events through `/api/interactions`.

Events:

- view
- save
- review
- check-in
- share
- route request
- itinerary add

`src/services/profile-engine.ts` converts these events into a preference profile containing preferred vibes, preferred cities, preferred categories, average budget, mobility bias, and hidden-gem affinity. `/api/recommendations` uses the recent profile when a user is signed in and a database exists; otherwise it uses a deterministic default profile so the prototype still feels personalized without infrastructure.

## Itinerary Generation

`src/services/itinerary-engine.ts` turns preferences into a route.

Algorithm:

1. Generate city pulse context for the selected city/vibe/day part.
2. Convert request preferences into a recommendation query.
3. Rank candidate places with recommendation and pulse context.
4. Select a stop count based on available hours.
5. Estimate mobility from the start point to each stop.
6. Estimate cost from price level and transport.
7. Assign start times based on travel plus stop duration.
8. Return total distance, total travel time, total cost, and stop notes.

When a user session and database are available, `/api/itinerary` attempts to persist the generated plan and ordered stops.

## Mobility Engine

`src/services/mobility-engine.ts` computes:

- Distance via Haversine.
- Duration from simulated Kosovo city speed assumptions.
- Wait time for taxi and bus.
- Estimated cost per method.
- Carbon score.
- Availability.
- Route points for frontend visualization.

This is Google Maps-ready: the API already returns route points, while the UI can later swap the simulated route for provider-backed directions.

## Authentication Flow

NextAuth is configured in `src/lib/auth/options.ts`.

Providers:

- Credentials provider for local seeded accounts.
- Google provider when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist.

Session strategy:

- JWT sessions.
- Role and user id are embedded in the token and copied to `session.user`.

Protected flows:

- `/business/*` requires `BUSINESS_OWNER` or `ADMIN`.
- `/admin/*` requires `ADMIN`.
- API routes also enforce role checks where mutations or admin reads matter.

## State Management

Zustand is used in `src/store/app-store.ts`.

Stored state:

- selected vibe
- discovery filters
- user location
- saved place ids
- itinerary draft

Why Zustand:

- The app needs lightweight UI intent shared across pages.
- Server data still belongs to the API.
- Persist middleware enables local saved state and offline-friendly behavior.

## Component Communication

- Pages compose feature components.
- Feature components read/update Zustand for UI state.
- Feature components call API routes for server data.
- Low-level UI primitives are stateless and reusable.
- Service modules are imported by server components/API routes; client components call API routes. Static metric helpers are the only client-side exception.

## External Integrations

Google Maps:

- `GooglePlacesMap` lazy-loads Google Maps when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` exists.
- Marker positions come from `PlaceDTO.coordinates`, which are mapped directly from `Place.latitude` and `Place.longitude`.
- Coordinates are validated against the Kosovo polygon before marker creation; invalid records are logged and skipped.
- Without a token or on load failure, the app renders exact-coordinate navigation links instead of fake marker positions.

OpenAI:

- `OPENAI_API_KEY` is reserved.
- The current recommendation engine is simulated and deterministic.
- Future OpenAI usage should generate narratives and chat responses from ranked candidates, not replace the ranking blindly.

Weather:

- `weather-service.ts` uses Open-Meteo and caches responses with Next fetch revalidation.

Cloudinary:

- `upload-service.ts` creates signed upload payloads when Cloudinary env vars exist.
- Without env vars, the UI explains preview-only behavior.

## Security

Implemented:

- Role-based middleware.
- API role checks.
- JWT sessions through NextAuth.
- Password hashing with bcrypt.
- Zod validation for API inputs.
- In-memory rate limiting.
- Environment variable separation with `.env.example`.

Production upgrades:

- Redis-backed rate limiting.
- CSRF review for custom mutation endpoints.
- Audit logs for admin actions.
- Moderation classifier for review/photo queues.
- Signed upload constraints and media scanning.
- Secrets managed by deployment platform, not checked into the repo.

## Performance

Implemented:

- App Router pages.
- API cache headers for place discovery.
- API cache headers for pulse reads.
- Open-Meteo revalidation.
- Next Image optimization for remote images.
- Lazy client fetching for recommendation, weather, dashboard, and mobility data.
- Prisma indexes for common filters.

Future upgrades:

- Cursor pagination for discovery.
- PostGIS distance filtering.
- Redis cache for recommendation candidate sets.
- Edge-safe read endpoints for public discovery.
- Background analytics aggregation.

## Testing

Current tests:

- Recommendation ranking.
- Interaction-profile scoring.
- Pulse city intelligence.
- Mobility route calculations.
- Itinerary generation shape.
- Vibe selector render smoke test.

Future CI/CD:

- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
- Add Playwright for mobile discovery, itinerary, auth, and dashboard flows.
- Add Prisma migration checks before deployment.
