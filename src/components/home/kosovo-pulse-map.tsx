"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const nodes = [
  { city: "Prishtina", x: 58, y: 38 },
  { city: "Prizren", x: 42, y: 67 },
  { city: "Peja", x: 25, y: 40 },
  { city: "Gjakova", x: 31, y: 56 },
  { city: "Brezovica", x: 57, y: 74 }
];

export function KosovoPulseMap() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/20 bg-white/12 p-5 text-white shadow-glass backdrop-blur-2xl">
      <div className="map-grid absolute inset-0 opacity-70" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-56 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[44%_56%_48%_52%/36%_42%_58%_64%] border border-teal-200/60 bg-teal-300/12 shadow-glow"
        animate={{
          scale: [1, 1.035, 1],
          rotate: [-1, 1, -1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0">
        {nodes.map((node, index) => (
          <motion.div
            key={node.city}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
          >
            <span className="absolute -inset-2 animate-ping rounded-full bg-rose-300/30" />
            <span className="relative flex items-center gap-1 rounded-full border border-white/25 bg-slate-950/72 px-2 py-1 text-xs backdrop-blur-xl">
              <MapPin className="h-3 w-3 text-teal-200" />
              {node.city}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-md border border-white/15 bg-slate-950/54 p-3 backdrop-blur-xl">
        <p className="text-sm font-semibold">{t("mapPreview.title")}</p>
        <p className="mt-1 text-xs text-white/70">{t("mapPreview.text")}</p>
      </div>
    </div>
  );
}
