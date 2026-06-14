"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getPlaceImageCandidates, shouldBypassNextImageOptimization } from "@/lib/place-images";
import { cn } from "@/lib/utils";
import type { PlaceDTO } from "@/types";

type ResilientPlaceImageProps = Omit<ImageProps, "alt" | "onError" | "src"> & {
  place: PlaceDTO;
  alt?: string;
  fallbackClassName?: string;
  imageWidth?: number;
};

export function ResilientPlaceImage({
  place,
  alt,
  className,
  fallbackClassName,
  imageWidth = 1200,
  ...imageProps
}: ResilientPlaceImageProps) {
  const candidates = useMemo(() => getPlaceImageCandidates(place, imageWidth), [imageWidth, place]);
  const candidateKey = candidates.join("|");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const src = candidates[candidateIndex];
  const isFill = Boolean(imageProps.fill);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidateKey]);

  if (!src) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-teal-900 via-slate-950 to-rose-950 text-xs font-semibold uppercase tracking-wide text-white/70",
          isFill && "absolute inset-0",
          fallbackClassName
        )}
      >
        {place.city || "Kosovo"}
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={src}
      alt={alt ?? place.title}
      className={className}
      unoptimized={imageProps.unoptimized ?? shouldBypassNextImageOptimization(src)}
      onError={() => {
        setCandidateIndex((index) => Math.min(index + 1, candidates.length));
      }}
    />
  );
}
