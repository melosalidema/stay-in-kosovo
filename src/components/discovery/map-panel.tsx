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
    <section className={cn("experience-card-discovery isolate overflow-hidden bg-card/[0.92]", className)}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-bold">{t("mapPanel.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("mapPanel.subtitle")}</p>
        </div>
        <Button variant="outline" size="icon" onClick={requestLocation} aria-label={t("mapPanel.useCurrentLocation")}>
          <LocateFixed className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      <GooglePlacesMap
        places={places}
        title={t("mapPanel.eventHeatmap")}
        subtitle={t("mapPanel.demand")}
        className="h-[360px] min-h-0 rounded-none border-0 shadow-none sm:h-[460px] lg:h-[calc(100vh-8rem)] lg:min-h-[420px] lg:max-h-[620px]"
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
