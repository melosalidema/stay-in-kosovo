"use client";

import { motion } from "framer-motion";
import { Clock, Heart, MapPin, Route, Star, Wallet } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO } from "@/types";

const trackedViewPlaces = new Set<string>();

export function PlaceCard({ place, compact = false }: { place: PlaceDTO; compact?: boolean }) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const viewTracked = useRef(false);
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
      <Card className="overflow-hidden bg-card/82 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-glass">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={place.images[0]}
            alt={place.title}
            fill
            sizes={compact ? "320px" : "(min-width: 1024px) 420px, 100vw"}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {place.vibeTags.slice(0, 2).map((vibe) => (
              <Badge key={vibe} variant="glass">
                {labels.vibe(vibe)}
              </Badge>
            ))}
          </div>
          <Button
            size="icon"
            variant="glass"
            className="absolute right-3 top-3"
            onClick={() => {
              toggleSavedPlace(place);
              track("SAVE");
            }}
            aria-label={saved ? t("placeCard.removeSaved") : t("placeCard.save")}
          >
            <Heart className={saved ? "h-4 w-4 fill-rose-400 text-rose-400" : "h-4 w-4"} />
          </Button>
        </div>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">{place.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {place.city} · {labels.category(place.category.slug)}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" />
              {place.rating}
            </div>
          </div>

          {!compact && <p className="line-clamp-2 text-sm text-muted-foreground">{place.description}</p>}

          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-2">
              <Clock className="h-3.5 w-3.5" />
              {place.avgStayMinutes}m
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-2">
              <Wallet className="h-3.5 w-3.5" />
              {formatCurrency(place.priceLevel * 8)}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-2">
              <Route className="h-3.5 w-3.5" />
              {place.transportation.walkingFriendly
                ? t("placeCard.walk")
                : place.transportation.busAvailable
                  ? t("placeCard.bus")
                  : t("placeCard.taxi")}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}
