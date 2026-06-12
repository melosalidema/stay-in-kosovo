"use client";

import { useTranslation } from "react-i18next";

import { GooglePlacesMap } from "@/components/maps/google-places-map";
import type { PlaceDTO } from "@/types";

export function KosovoPulseMap({ places }: { places: PlaceDTO[] }) {
  const { t } = useTranslation();

  return (
    <GooglePlacesMap
      places={places}
      title={t("mapPreview.title")}
      subtitle={t("mapPreview.text")}
      className="min-h-[420px]"
      variant="glass"
      theme="dark"
      defaultZoom={8}
      fitPadding={48}
      animatedMarkers
    />
  );
}
