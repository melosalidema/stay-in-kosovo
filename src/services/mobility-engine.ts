import { transportPoints } from "@/data/kosovo-data";
import { clamp } from "@/lib/utils";
import type { Coordinates, MobilityOption, MobilityRequest, TransportMethod } from "@/types";

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

    return {
      method,
      label: labelFor(method),
      distanceKm: Number(distance.toFixed(2)),
      durationMinutes: Math.max(duration, method === "WALKING" ? 4 : 3),
      estimatedCost: Number(cost.toFixed(2)),
      carbonScore: clamp(method === "WALKING" || method === "BIKE" ? 98 : method === "BUS" ? 72 : 38, 1, 100),
      availability: availabilityFor(method, distance),
      routePoints: routePoints(request.from, request.to),
      reason: reasonFor(method, duration, cost)
    } satisfies MobilityOption;
  });

  return options.sort((a, b) => {
    if (request.preference && a.method === request.preference) return -1;
    if (request.preference && b.method === request.preference) return 1;
    return a.durationMinutes + a.estimatedCost * 2 - (b.durationMinutes + b.estimatedCost * 2);
  });
}

export function getNearbyTransportPoints(city?: string) {
  return transportPoints.filter((point) => !city || point.city.toLowerCase() === city.toLowerCase());
}
