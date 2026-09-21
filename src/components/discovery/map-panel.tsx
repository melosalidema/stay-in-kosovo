"use client";

import { LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap } from "@/components/maps/google-places-map";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { cn } from "@/lib/utils";
import type { PlaceDTO } from "@/types";
import type { MapSelectionSource } from "@/components/maps/google-places-map";

export function MapPanel({
  places,
  className,
  selectedPlaceId,
  onSelectedPlaceChange
}: {
  places: PlaceDTO[];
  className?: string;
  selectedPlaceId?: string | null;
  onSelectedPlaceChange?: (place: PlaceDTO, source: MapSelectionSource) => void;
}) {
  const { t } = useTranslation();
  const { requestLocation, loading } = useGeolocation();

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-serif text-lg leading-tight">{t("mapPanel.title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("mapPanel.subtitle")}</p>
        </div>
        <Button variant="outline" size="icon" onClick={requestLocation} aria-label={t("mapPanel.useCurrentLocation")}>
          <LocateFixed className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} aria-hidden="true" />
        </Button>
      </div>

      <GooglePlacesMap
        places={places}
        title={t("mapPanel.title")}
        subtitle={t("mapPanel.subtitle")}
        className="h-[320px] min-h-0 rounded-none border-0 shadow-none sm:h-[420px] lg:h-[560px]"
        variant="card"
        theme="auto"
        defaultZoom={11}
        fitPadding={54}
        selectedPlaceId={selectedPlaceId}
        onSelectedPlaceChange={onSelectedPlaceChange}
      />
    </section>
  );
}
