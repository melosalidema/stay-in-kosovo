"use client";

import { Clock, Heart, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResilientPlaceImage } from "@/components/places/resilient-place-image";
import { Badge } from "@/components/ui/badge";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { PlaceDTO } from "@/types";

const trackedViewPlaces = new Set<string>();

export function PlaceCard({
  place,
  compact = false,
  selected = false,
  onSelect
}: {
  place: PlaceDTO;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (place: PlaceDTO) => void;
}) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();
  const viewTracked = useRef(false);
  const [savedAnimate, setSavedAnimate] = useState(false);
  const saved = useAppStore((state) => state.savedPlaceIds.includes(place.id));
  const toggleSavedPlace = useAppStore((state) => state.toggleSavedPlace);

  const track = (type: "VIEW" | "SAVE") => {
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

  const handleToggleSave = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleSavedPlace(place.id);
    track("SAVE");
    setSavedAnimate(true);
    window.setTimeout(() => setSavedAnimate(false), 420);
  };

  const primaryVibe = place.vibeTags[0];
  const accessNote = place.transportation.walkingFriendly
    ? t("placeCard.walk")
    : place.transportation.busAvailable
      ? t("placeCard.bus")
      : t("placeCard.taxi");

  return (
    <article
      className={cn(
        "glass-panel-strong glass-panel group flex h-full flex-col overflow-hidden rounded-xl",
        "transition-[border-color,box-shadow,transform] duration-300 ease-calm",
        "hover:-translate-y-1 hover:shadow-lift",
        onSelect && "cursor-pointer",
        selected && "ring-2 ring-primary/45"
      )}
      onClick={() => onSelect?.(place)}
      onFocus={() => track("VIEW")}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(place);
        }
      }}
    >
      <div className={cn("media-frame rounded-none", compact ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <ResilientPlaceImage
          place={place}
          fill
          imageWidth={compact ? 640 : 1200}
          sizes={compact ? "(min-width: 1024px) 320px, 100vw" : "(min-width: 1024px) 380px, 100vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {primaryVibe && (
          <Badge variant="glass" className="absolute bottom-3 left-3">
            {labels.vibe(primaryVibe)}
          </Badge>
        )}

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? t("placeCard.removeSaved") : t("placeCard.save")}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-foreground shadow-soft transition-[background-color,transform] duration-200 hover:bg-white active:scale-95 dark:bg-black/70 dark:text-white"
        >
          <Heart
            className={cn("h-4 w-4", saved ? "fill-rose-500 text-rose-500" : "", savedAnimate && "heart-bounce")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-base font-semibold leading-snug">{place.title}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
            {place.rating}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {place.city}
            <span className="text-muted-foreground/60"> · {labels.category(place.category.slug)}</span>
          </span>
        </p>

        {!compact && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("placeCard.typicalStay", { minutes: place.avgStayMinutes })}
          </span>
          <span>{formatCurrency(place.priceLevel * 8)}</span>
          <span className="text-muted-foreground/80">{accessNote}</span>
        </div>

        {!compact && (
          <div className="mt-4 border-t border-border/70 pt-3 text-sm">
            <Link
              href={`/discover/${place.slug}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {t("placeCard.seeDetails")}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
