"use client";

import { CloudSun, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Weather = {
  city: string;
  temperature: number;
  windKph: number;
  summary: string;
};

export function WeatherStrip() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    fetch("/api/weather?city=Prishtina")
      .then((response) => response.json())
      .then((payload) => setWeather(payload.data))
      .catch(() => undefined);
  }, []);

  if (!weather) return null;

  return (
    <section className="border-y border-border bg-card/[0.72] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <CloudSun className="h-4 w-4 text-primary" />
          {weather.city}: {weather.temperature}C · {weather.summary}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <Wind className="h-4 w-4" />
          {t("weather.wind")} {weather.windKph} km/h · {t("weather.cached")}
        </span>
      </div>
    </section>
  );
}
