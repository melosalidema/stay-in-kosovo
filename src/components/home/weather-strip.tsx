"use client";

import { CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Weather = {
  city: string;
  temperature: number;
  windKph: number;
  summary: string;
};

function weatherIcon(summary: string) {
  const s = summary.toLowerCase();

  if (s.includes("rain") || s.includes("drizzle") || s.includes("shower")) return CloudRain;
  if (s.includes("snow") || s.includes("sleet")) return CloudSnow;
  if (s.includes("cloud") || s.includes("overcast")) return CloudSun;
  return Sun;
}

export function WeatherStrip() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    fetch("/api/weather?city=Prishtina")
      .then((response) => response.json())
      .then((payload) => setWeather(payload.data))
      .catch(() => undefined);
  }, []);

  const Icon = useMemo(() => (weather ? weatherIcon(weather.summary) : Sun), [weather]);

  if (!weather) return null;

  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="page-shell flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-foreground">
            {weather.city} · {weather.temperature}°C
          </span>
          <span>{weather.summary}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <Wind className="h-4 w-4" aria-hidden="true" />
          {t("weather.wind")} {weather.windKph} km/h
        </span>
      </div>
    </section>
  );
}
