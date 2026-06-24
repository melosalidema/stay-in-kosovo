import { transportPoints } from "@/data/kosovo-data";
import { clamp } from "@/lib/utils";
import type { Coordinates, MobilityOption, MobilityRequest, MobilityRoute, TransportMethod } from "@/types";

const SPEED_KM_H: Record<TransportMethod, number> = {
  WALKING: 4.8,
  TAXI: 31,
  BUS: 22,
  BIKE: 13.5,
  CAR: 34
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKm(from: Coordinates, to: Coordinates) {
  const radiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radiusKm * c;
}

function midpoint(from: Coordinates, to: Coordinates): Coordinates {
  return {
    lat: (from.lat + to.lat) / 2 + 0.002,
    lng: (from.lng + to.lng) / 2 - 0.0015
  };
}

function routePoints(from: Coordinates, to: Coordinates): Coordinates[] {
  return [from, midpoint(from, to), to];
}

function decodePolyline(polyline: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function encodeSignedCoordinate(value: number) {
  let coordinate = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";

  while (coordinate >= 0x20) {
    encoded += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
    coordinate >>= 5;
  }

  return encoded + String.fromCharCode(coordinate + 63);
}

export function encodePolyline(points: Coordinates[]) {
  let previousLat = 0;
  let previousLng = 0;

  return points
    .map((point) => {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);
      const encoded = encodeSignedCoordinate(lat - previousLat) + encodeSignedCoordinate(lng - previousLng);

      previousLat = lat;
      previousLng = lng;

      return encoded;
    })
    .join("");
}

type RouteBounds = NonNullable<MobilityRoute["bounds"]>;

function routeBounds(points: Coordinates[]): RouteBounds {
  return points.reduce<RouteBounds>(
    (bounds, point) => ({
      northeast: {
        lat: Math.max(bounds.northeast.lat, point.lat),
        lng: Math.max(bounds.northeast.lng, point.lng)
      },
      southwest: {
        lat: Math.min(bounds.southwest.lat, point.lat),
        lng: Math.min(bounds.southwest.lng, point.lng)
      }
    }),
    {
      northeast: { lat: -90, lng: -180 },
      southwest: { lat: 90, lng: 180 }
    }
  );
}

function simulatedRoute(points: Coordinates[], distance: number, durationMinutes: number): MobilityRoute {
  return {
    source: "simulated",
    polyline: encodePolyline(points),
    points,
    distanceMeters: Math.round(distance * 1000),
    durationSeconds: durationMinutes * 60,
    bounds: routeBounds(points),
    summary: "Simulated Kosovo route geometry"
  };
}

type GoogleRouteResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    description?: string;
    polyline?: {
      encodedPolyline?: string;
    };
    viewport?: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  }>;
};

const routesTravelMode: Record<TransportMethod, "WALK" | "DRIVE" | "TRANSIT" | "BICYCLE"> = {
  WALKING: "WALK",
  TAXI: "DRIVE",
  BUS: "TRANSIT",
  BIKE: "BICYCLE",
  CAR: "DRIVE"
};

function secondsFromGoogleDuration(duration: string | undefined) {
  const match = duration?.match(/^(\d+)s$/);
  return match ? Number(match[1]) : undefined;
}

async function fetchGoogleRoute(request: MobilityRequest, method: TransportMethod): Promise<MobilityRoute | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  const travelMode = routesTravelMode[method];
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: request.from.lat, longitude: request.from.lng } } },
    destination: { location: { latLng: { latitude: request.to.lat, longitude: request.to.lng } } },
    travelMode,
    computeAlternativeRoutes: true,
    languageCode: "en-GB",
    units: "METRIC"
  };

  if (travelMode === "DRIVE") {
    body.routingPreference = "TRAFFIC_UNAWARE";
  }

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.viewport,routes.description"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as GoogleRouteResponse;
  const route = payload.routes?.[0];
  const polyline = route?.polyline?.encodedPolyline;
  const durationSeconds = secondsFromGoogleDuration(route?.duration);

  if (!route || !polyline || !route.distanceMeters || !durationSeconds) return null;

  const points = decodePolyline(polyline);
  if (points.length < 2) return null;

  return {
    source: "google",
    polyline,
    points,
    distanceMeters: route.distanceMeters,
    durationSeconds,
    bounds: route.viewport
      ? {
          northeast: { lat: route.viewport.high.latitude, lng: route.viewport.high.longitude },
          southwest: { lat: route.viewport.low.latitude, lng: route.viewport.low.longitude }
        }
      : routeBounds(points),
    summary: route.description
  };
}

function costFor(method: TransportMethod, distance: number) {
  if (method === "WALKING") return 0;
  if (method === "BUS") return 0.5;
  if (method === "BIKE") return Math.max(1, distance * 0.25);
  if (method === "CAR") return distance * 0.32;
  return 2 + distance * 0.9;
}

function availabilityFor(method: TransportMethod, distance: number): MobilityOption["availability"] {
  if (method === "WALKING") return distance < 2.2 ? "high" : distance < 4 ? "medium" : "low";
  if (method === "BUS") return distance > 1.2 ? "medium" : "low";
  if (method === "TAXI") return "high";
  if (method === "BIKE") return distance < 8 ? "medium" : "low";
  return "medium";
}

function labelFor(method: TransportMethod) {
  return {
    WALKING: "Walkable route",
    TAXI: "Taxi suggestion",
    BUS: "Bus simulation",
    BIKE: "Bike-friendly path",
    CAR: "Drive route"
  }[method];
}

function reasonFor(method: TransportMethod, duration: number, cost: number) {
  if (method === "WALKING") return `Best for short urban hops, about ${duration} min and no cost.`;
  if (method === "BUS") return `Low-cost public route, simulated fare about EUR ${cost.toFixed(1)}.`;
  if (method === "TAXI") return `Fastest flexible option when nightlife or weather makes walking less ideal.`;
  if (method === "BIKE") return `Good middle ground for parks and riverside movement.`;
  return `Useful when the route crosses cities or mountain areas.`;
}

export function calculateMobilityOptions(request: MobilityRequest): MobilityOption[] {
  const distance = distanceKm(request.from, request.to);
  const methods: TransportMethod[] = ["WALKING", "TAXI", "BUS", "BIKE", "CAR"];

  const options = methods.map((method) => {
    const speed = SPEED_KM_H[method];
    const baseMinutes = (distance / speed) * 60;
    const waitMinutes = method === "BUS" ? 8 : method === "TAXI" ? 4 : 0;
    const duration = Math.ceil(baseMinutes + waitMinutes);
    const cost = costFor(method, distance);
    const points = routePoints(request.from, request.to);

    return {
      method,
      label: labelFor(method),
      distanceKm: Number(distance.toFixed(2)),
      durationMinutes: Math.max(duration, method === "WALKING" ? 4 : 3),
      estimatedCost: Number(cost.toFixed(2)),
      carbonScore: clamp(method === "WALKING" || method === "BIKE" ? 98 : method === "BUS" ? 72 : 38, 1, 100),
      availability: availabilityFor(method, distance),
      routePoints: points,
      route: simulatedRoute(points, distance, Math.max(duration, method === "WALKING" ? 4 : 3)),
      reason: reasonFor(method, duration, cost)
    } satisfies MobilityOption;
  });

  return options.sort((a, b) => {
    if (request.preference && a.method === request.preference) return -1;
    if (request.preference && b.method === request.preference) return 1;
    return a.durationMinutes + a.estimatedCost * 2 - (b.durationMinutes + b.estimatedCost * 2);
  });
}

export async function calculateMobilityOptionsWithGoogleRoutes(request: MobilityRequest): Promise<MobilityOption[]> {
  const options = calculateMobilityOptions(request);
  const googleRoutes = await Promise.all(options.map((option) => fetchGoogleRoute(request, option.method).catch(() => null)));

  return options.map((option, index) => {
    const googleRoute = googleRoutes[index];
    if (!googleRoute) return option;

    const distanceKmValue = googleRoute.distanceMeters / 1000;

    return {
      ...option,
      distanceKm: Number(distanceKmValue.toFixed(2)),
      durationMinutes: Math.max(Math.ceil(googleRoute.durationSeconds / 60), option.method === "WALKING" ? 4 : 3),
      estimatedCost: Number(costFor(option.method, distanceKmValue).toFixed(2)),
      availability: availabilityFor(option.method, distanceKmValue),
      routePoints: googleRoute.points,
      route: googleRoute
    };
  });
}

export function getNearbyTransportPoints(city?: string) {
  return transportPoints.filter((point) => !city || point.city.toLowerCase() === city.toLowerCase());
}
