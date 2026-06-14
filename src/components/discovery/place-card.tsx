"use client";

import { motion } from "framer-motion";
import { Clock, ExternalLink, Heart, MapPin, Route, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResilientPlaceImage } from "@/components/places/resilient-place-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { discoveryPlaceCardStyle, homePulseCardStyle } from "@/components/ui/experience-card-effects";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { googleMapsDirectionsUrl } from "@/lib/geo";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO } from "@/types";

const trackedViewPlaces = new Set<string>();

type PlaceCardSurface = "discovery" | "home";

export function PlaceCard({
  place,
  compact = false,
  surface = "discovery",
  selected = false,
  onSelect
}: {
  place: PlaceDTO;
  compact?: boolean;
  surface?: PlaceCardSurface;
  selected?: boolean;
  onSelect?: (place: PlaceDTO) => void;
}) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const viewTracked = useRef(false);
  const [hovered, setHovered] = useState(false);
  const saved = useAppStore((state) => state.savedPlaceIds.includes(place.id));
  const toggleSavedPlace = useAppStore((state) => state.toggleSavedPlace);

  const track = (type: "VIEW" | "SAVE" | "ROUTE_REQUEST") => {
    if (type === "VIEW") {
      if (viewTracked.current || trackedViewPlaces.has(place.id)) return;
      viewTracked.current = true;
      trackedViewPlaces.add(place.id);
    }

    const payload = JSON.stringify({
      type,
      placeId: place.slug,
      city: place.city,
      vibe: place.vibeTags[0],
      metadata: {
        source: "place-card",
        category: place.category.slug,
        transportPreference: place.transportation.walkingFriendly ? "WALKING" : "TAXI"
      }
    });

    if (type === "VIEW" && "sendBeacon" in navigator) {
      const sent = navigator.sendBeacon("/api/interactions", new Blob([payload], { type: "application/json" }));
      if (sent) return;
    }

    fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: type === "VIEW"
    }).catch(() => undefined);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onViewportEnter={() => track("VIEW")}
      viewport={{ once: true, amount: 0.35 }}
    >
      <Card
        style={surface === "home" ? homePulseCardStyle(place.popularityScore, hovered) : discoveryPlaceCardStyle(place, hovered)}
        className={
          surface === "home"
            ? "experience-card-home group relative overflow-hidden bg-card/[0.92]"
            : `experience-card-discovery editorial-card group relative overflow-hidden bg-card/[0.96] ${selected ? "ring-2 ring-primary/45" : ""}`
        }
        onClick={() => onSelect?.(place)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        tabIndex={0}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px origin-left scale-x-0 bg-primary/[0.45] transition-transform duration-300 group-hover:scale-x-100" />
        <div className="experience-media relative z-10 aspect-[16/10]">
          <ResilientPlaceImage
            place={place}
            fill
            imageWidth={compact ? 640 : 1200}
            sizes={compact ? "320px" : "(min-width: 1024px) 420px, 100vw"}
            className="experience-image"
          />
          <div className={surface === "home" ? "absolute inset-0 bg-gradient-to-t from-black/[0.62] via-black/[0.05] to-transparent" : "absolute inset-0 bg-gradient-to-t from-black/[0.36] via-transparent to-transparent"} />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {place.vibeTags.slice(0, surface === "home" ? 2 : 1).map((vibe) => (
              <Badge key={vibe} variant="glass" className={surface === "home" ? "" : "bg-black/[0.22] text-white/[0.92]"}>
                {labels.vibe(vibe)}
              </Badge>
            ))}
          </div>
          <Button
            size="icon"
            variant="glass"
            className="absolute right-3 top-3"
            onClick={(event) => {
              event.stopPropagation();
              toggleSavedPlace(place);
              track("SAVE");
            }}
            aria-label={saved ? t("placeCard.removeSaved") : t("placeCard.save")}
          >
            <Heart className={saved ? "h-4 w-4 fill-rose-400 text-rose-400" : "h-4 w-4"} />
          </Button>
        </div>
        <CardContent className="relative z-10 space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant={surface === "home" ? "default" : "outline"} className="mb-2">
                {labels.category(place.category.slug)}
              </Badge>
              <h3 className="truncate text-base font-bold leading-tight">{place.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {place.city}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-amber-500/[0.1] px-2 py-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" />
              {place.rating}
            </div>
          </div>

          {!compact && <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>}

          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span className="soft-stat flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {place.avgStayMinutes}m
            </span>
            <span className="soft-stat flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              {formatCurrency(place.priceLevel * 8)}
            </span>
            <span className="soft-stat flex items-center gap-1">
              <Route className="h-3.5 w-3.5" />
              {place.transportation.walkingFriendly
                ? t("placeCard.walk")
                : place.transportation.busAvailable
                  ? t("placeCard.bus")
                  : t("placeCard.taxi")}
            </span>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="px-2 text-xs" onClick={(event) => event.stopPropagation()}>
                <Link href={`/discover/${place.slug}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("googleMap.details")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="px-2 text-xs" onClick={(event) => event.stopPropagation()}>
                <a href={googleMapsDirectionsUrl(place.coordinates)} target="_blank" rel="noreferrer" onClick={() => track("ROUTE_REQUEST")}>
                  <Route className="h-3.5 w-3.5" />
                  {t("googleMap.directions")}
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.article>
  );
}
