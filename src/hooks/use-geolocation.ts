"use client";

import { useCallback, useState } from "react";

import { useAppStore } from "@/store/app-store";
import type { Coordinates } from "@/types";

const fallbackPrishtina: Coordinates = { lat: 42.6629, lng: 21.1655 };

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setLocation = useAppStore((state) => state.setLocation);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setLocation(fallbackPrishtina);
      setLoading(false);
      setError("geo.unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      () => {
        setLocation(fallbackPrishtina);
        setError("geo.denied");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 6000
      }
    );
  }, [setLocation]);

  return { requestLocation, loading, error };
}
