"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlaceDTO } from "@/types";

export function PlaceImageCarousel({ place }: { place: PlaceDTO }) {
  const images = place.images.filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    goTo((current + 1) % images.length);
  }, [current, images.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + images.length) % images.length);
  }, [current, images.length, goTo]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  if (images.length <= 1) return null;

  return (
    <>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[current]}
            alt={`${place.title} ${current + 1}`}
            fill
            sizes="(min-width: 1024px) 760px, 100vw"
            className="object-cover"
            priority={current === 0}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
        onClick={prev}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
        onClick={next}
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute right-4 top-4 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
        {current + 1} / {images.length}
      </div>
    </>
  );
}
