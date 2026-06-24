"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { useLocalizedLabels } from "@/i18n/use-localized-labels";

const entries: { slug: string; glyph: string; color: string }[] = [
  { slug: "restaurants", glyph: "R", color: "#ef4444" },
  { slug: "cafes", glyph: "C", color: "#f59e0b" },
  { slug: "nightlife", glyph: "M", color: "#ec4899" },
  { slug: "nature", glyph: "N", color: "#22c55e" },
  { slug: "culture", glyph: "A", color: "#38bdf8" },
  { slug: "events", glyph: "E", color: "#8b5cf6" },
  { slug: "parks", glyph: "N", color: "#14b8a6" },
  { slug: "hotels", glyph: "H", color: "#2563eb" },
  { slug: "shopping", glyph: "S", color: "#f97316" },
];

export function CategoryLegend({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();

  return (
    <div className="experience-card-discovery overflow-hidden bg-card/[0.92]">
      <div className="flex flex-wrap items-center gap-1.5 p-3">
        {entries.map(({ slug, glyph, color }) => {
          const isActive = selectedCategory === slug;
          return (
            <motion.button
              key={slug}
              onClick={() => onSelectCategory(isActive ? null : slug)}
              whileTap={{ scale: 0.94 }}
              className={
                "relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 " +
                (isActive
                  ? "border-transparent text-white shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")
              }
              style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="legend-active-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: color }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex h-5 w-5 items-center justify-center rounded text-[11px] font-extrabold"
                style={isActive ? { color: "white" } : { backgroundColor: `${color}1a`, color }}
              >
                {glyph}
              </span>
              <span className="relative z-10">{labels.category(slug)}</span>
            </motion.button>
          );
        })}
      </div>

      {selectedCategory && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entries.find((e) => e.slug === selectedCategory)?.color }}
            />
            {labels.category(selectedCategory)}
          </p>
          <motion.button
            onClick={() => onSelectCategory(null)}
            whileTap={{ scale: 0.94 }}
            className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.08]"
          >
            {t("discover.resetFilters")}
          </motion.button>
        </div>
      )}
    </div>
  );
}
