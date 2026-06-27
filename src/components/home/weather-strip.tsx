"use client";

import { motion } from "framer-motion";
import { CloudSun, CloudRain, CloudSnow, Sun, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Weather = {
  city: string;
  temperature: number;
  windKph: number;
  summary: string;
};

function WeatherIcon({ summary }: { summary: string }) {
  const s = summary.toLowerCase();

  const icon = useMemo(() => {
    if (s.includes("rain") || s.includes("drizzle") || s.includes("shower")) return CloudRain;
    if (s.includes("snow") || s.includes("sleet")) return CloudSnow;
    if (s.includes("cloud") || s.includes("overcast")) return CloudSun;
    return Sun;
  }, [s]);

  return (
    <motion.div
      animate={{ rotate: [0, -8, 8, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {icon === Sun ? (
        <Sun className="h-4 w-4 text-primary" />
      ) : icon === CloudRain ? (
        <CloudRain className="h-4 w-4 text-primary" />
      ) : icon === CloudSnow ? (
        <CloudSnow className="h-4 w-4 text-primary" />
      ) : (
        <CloudSun className="h-4 w-4 text-primary" />
      )}
    </motion.div>
  );
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

  if (!weather) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border-y border-border bg-card/[0.72] px-4 py-3 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <WeatherIcon summary={weather.summary} />
          {weather.city}: {weather.temperature}°C · {weather.summary}
        </span>
        <motion.span
          className="flex items-center gap-2 text-muted-foreground"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wind className="h-4 w-4" />
          {t("weather.wind")} {weather.windKph} km/h · {t("weather.cached")}
        </motion.span>
      </div>
    </motion.section>
  );
}
