export type UserRole = "USER" | "BUSINESS_OWNER" | "ADMIN";

export type VibeName =
  | "Chill"
  | "Nightlife"
  | "Romantic"
  | "Adventure"
  | "Local Food"
  | "Hidden Gems"
  | "Family Friendly"
  | "Culture"
  | "Sacred & Spiritual"
  | "Adventure & Trails"
  | "Wildlife & Nature"
  | "Living History"
  | "Ottoman Heritage"
  | "City Life";

export type TransportMethod = "WALKING" | "TAXI" | "BUS" | "BIKE" | "CAR";
export type DayPart = "MORNING" | "AFTERNOON" | "EVENING" | "LATE_NIGHT";
export type InteractionType =
  | "VIEW"
  | "SAVE"
  | "REVIEW"
  | "CHECK_IN"
  | "SHARE"
  | "ROUTE_REQUEST"
  | "ITINERARY_ADD";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  type: "FOOD" | "NIGHTLIFE" | "NATURE" | "CULTURE" | "EVENT" | "WELLNESS" | "SHOPPING" | "STAY";
  icon: string;
};

export type PlaceDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  city: string;
  address: string;
  category: CategoryDTO;
  coordinates: Coordinates;
  priceLevel: number;
  openingHours?: string;
  rating: number;
  reviewCount: number;
  avgStayMinutes: number;
  openNow: boolean;
  vibeTags: string[];
  atmosphereTags: string[];
  musicVibe?: string;
  crowdLevel?: string;
  images: string[];
  transportation: {
    walkingFriendly: boolean;
    taxiMinutes: number;
    busAvailable: boolean;
    parking?: string;
  };
  accessibility?: Record<string, unknown>;
  popularityScore: number;
  hiddenGemScore: number;
  business?: {
    id: string;
    name: string;
    verified: boolean;
    boostScore: number;
  };
};

export type EventDTO = {
  id: string;
  title: string;
  description: string;
  city: string;
  startsAt: string;
  endsAt: string;
  price: number;
  heatScore: number;
  vibeTags: string[];
  placeSlug?: string;
  images: string[];
};

export type RecommendationInput = {
  userId?: string;
  vibes: string[];
  city?: string;
  budget?: number;
  location?: Coordinates;
  transportPreference?: TransportMethod;
  openNow?: boolean;
  dayPart?: DayPart;
  partySize?: number;
  avoidCrowds?: boolean;
  accessibilityRequired?: boolean;
  interactionProfile?: PreferenceProfile;
  limit?: number;
};

export type RecommendationResult = {
  place: PlaceDTO;
  score: number;
  reasons: string[];
  scoreBreakdown: {
    vibe: number;
    distance: number;
    budget: number;
    quality: number;
    novelty: number;
    mobility: number;
    businessBoost: number;
    context: number;
    personalization: number;
  };
};

export type MobilityRequest = {
  from: Coordinates;
  to: Coordinates;
  preference?: TransportMethod;
  city?: string;
};

export type MobilityOption = {
  method: TransportMethod;
  label: string;
  distanceKm: number;
  durationMinutes: number;
  estimatedCost: number;
  carbonScore: number;
  availability: "high" | "medium" | "low";
  routePoints: Coordinates[];
  reason: string;
};

export type ItineraryInput = {
  userId?: string;
  title?: string;
  city: string;
  budget: number;
  durationHours: number;
  interests: string[];
  vibe: string;
  transportPreference: TransportMethod;
  location?: Coordinates;
};

export type ItineraryStopDTO = {
  order: number;
  startTime: string;
  durationMinutes: number;
  travelMinutes: number;
  estimatedCost: number;
  note: string;
  place: PlaceDTO;
  mobility: MobilityOption;
};

export type ItineraryDTO = {
  title: string;
  description: string;
  city: string;
  vibe: string;
  budget: number;
  durationHours: number;
  totalCost: number;
  aiRationale: string;
  routeSummary: {
    distanceKm: number;
    travelMinutes: number;
    preferredMethod: TransportMethod;
  };
  stops: ItineraryStopDTO[];
};

export type ReviewInput = {
  placeId: string;
  rating: number;
  comment: string;
  atmosphereTags: string[];
  crowdLevel: string;
  musicVibe?: string;
  localPopularity?: string;
  photos?: string[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "green" | "amber" | "rose" | "blue";
};

export type PreferenceProfile = {
  preferredVibes: Record<string, number>;
  preferredCities: Record<string, number>;
  preferredCategories: Record<string, number>;
  averageBudget: number;
  mobilityBias: Partial<Record<TransportMethod, number>>;
  hiddenGemAffinity: number;
};

export type InteractionInput = {
  type: InteractionType;
  placeId?: string;
  eventId?: string;
  city?: string;
  vibe?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
};

export type PulseInput = {
  city?: string;
  vibe?: string;
  dayPart?: DayPart;
  location?: Coordinates;
};

export type PulseZone = {
  id: string;
  title: string;
  city: string;
  coordinates: Coordinates;
  intensity: number;
  primaryVibe: string;
  demandLevel: "low" | "medium" | "high" | "surging";
  mobilityPressure: "easy" | "moderate" | "busy";
  summary: string;
};

export type PulseInsight = {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "rose" | "blue";
};

export type ExperiencePulseDTO = {
  city: string;
  generatedAt: string;
  liveScore: number;
  crowdMode: "calm" | "balanced" | "lively" | "surging";
  topVibes: Array<{ vibe: string; score: number }>;
  zones: PulseZone[];
  insights: PulseInsight[];
  supplyGaps: Array<{ vibe: string; demand: number; supply: number; opportunity: string }>;
  suggestedActions: string[];
  transportHealth: {
    averageReliability: number;
    bestPoint?: string;
    weakestPoint?: string;
  };
  methodology: string[];
};
