"use client";

import { LocateFixed, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { PlaceDTO } from "@/types";

function mapboxStaticUrl(places: PlaceDTO[]) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token || !places.length) return null;

  const center = places[0].coordinates;
  const pins = places
    .slice(0, 5)
    .map((place) => `pin-s+0f766e(${place.coordinates.lng},${place.coordinates.lat})`)
    .join(",");

  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pins}/${center.lng},${center.lat},11,0/900x620@2x?access_token=${token}`;
}

export function MapPanel({ places }: { places: PlaceDTO[] }) {
  const { t } = useTranslation();
  const { requestLocation, loading } = useGeolocation();
  const mapUrl = mapboxStaticUrl(places);

  return (
    <section className="sticky top-24 overflow-hidden rounded-lg border border-border bg-card shadow-glass">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-sm font-bold">{t("mapPanel.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("mapPanel.subtitle")}</p>
        </div>
        <Button variant="outline" size="icon" onClick={requestLocation} aria-label={t("mapPanel.useCurrentLocation")}>
          <LocateFixed className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      <div className="relative min-h-[460px] bg-slate-950">
        {mapUrl ? (
          <Image
            src={mapUrl}
            alt={t("mapPanel.alt")}
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="map-grid absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-rose-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/84 via-transparent to-slate-950/20" />

        {places.slice(0, 5).map((place, index) => (
          <div
            key={place.id}
            className="absolute"
            style={{
              left: `${18 + ((index * 17) % 62)}%`,
              top: `${24 + ((index * 13) % 48)}%`
            }}
          >
            <div className="relative">
              <span className="absolute -inset-2 animate-ping rounded-full bg-primary/40" />
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <MapPin className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 left-4 right-4 space-y-3 rounded-lg border border-white/15 bg-white/12 p-4 text-white backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t("mapPanel.eventHeatmap")}</p>
              <p className="text-xs text-white/70">{t("mapPanel.demand")}</p>
            </div>
            <Badge variant="glass">
              <Navigation className="mr-1 h-3.5 w-3.5" />
              {t("mapPanel.smartEta")}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-emerald-400/18 p-2">{t("mapPanel.foodHigh")}</div>
            <div className="rounded-md bg-rose-400/18 p-2">{t("mapPanel.nightRising")}</div>
            <div className="rounded-md bg-amber-400/18 p-2">{t("mapPanel.natureCalm")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
