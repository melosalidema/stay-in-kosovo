"use client";

import { LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GooglePlacesMap } from "@/components/maps/google-places-map";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { cn } from "@/lib/utils";
import type { PlaceDTO } from "@/types";

export function MapPanel({ places, className }: { places: PlaceDTO[]; className?: string }) {
  const { t } = useTranslation();
  const { requestLocation, loading } = useGeolocation();

  return (
    <section className={cn("experience-card-discovery order-first overflow-hidden bg-card/[0.92] lg:sticky lg:top-24 lg:order-none", className)}>
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
        className="min-h-[360px] rounded-none border-0 shadow-none sm:min-h-[460px]"
        variant="card"
        theme="auto"
        defaultZoom={11}
        fitPadding={54}
      />
    </section>
  );
}
