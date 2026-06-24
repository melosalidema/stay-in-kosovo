"use client";

import dynamic from "next/dynamic";

import { type MapSelectionSource } from "@/components/maps/places-map-impl";
import type { Coordinates, PlaceDTO } from "@/types";

type MapVariant = "glass" | "card";
type MapTheme = "auto" | "dark" | "light";

type PlacesMapProps = {
  places: PlaceDTO[];
  title?: string;
  subtitle?: string;
  className?: string;
  mapClassName?: string;
  variant?: MapVariant;
  theme?: MapTheme;
  defaultZoom?: number;
  fitPadding?: number;
  focusZoom?: number;
  animatedMarkers?: boolean;
  selectedPlaceId?: string | null;
  defaultSelectedPlaceId?: string | null;
  onSelectedPlaceChange?: (place: PlaceDTO, source: MapSelectionSource) => void;
};

const PlacesMapImpl = dynamic(
  () => import("@/components/maps/places-map-impl").then((mod) => ({ default: mod.PlacesMapImpl })),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[360px] w-full place-items-center bg-muted/40 text-sm text-muted-foreground">
        Loading map…
      </div>
    )
  }
);

export type { Coordinates, MapSelectionSource, PlacesMapProps };

export function GooglePlacesMap(props: PlacesMapProps) {
  return <PlacesMapImpl {...props} />;
}
