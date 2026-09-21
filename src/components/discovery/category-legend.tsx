"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useLocalizedLabels } from "@/i18n/use-localized-labels";

const entries = ["restaurants", "cafes", "nightlife", "nature", "culture", "events", "parks", "hotels", "shopping"];

export function CategoryLegend({
  selectedCategory,
  onSelectCategory
}: {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}) {
  const { t } = useTranslation();
  const labels = useLocalizedLabels();

  return (
    <div className="no-scrollbar edge-fade -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <button
        type="button"
        aria-pressed={selectedCategory === null}
        onClick={() => onSelectCategory(null)}
        className={cn(
          "shrink-0 rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200",
          selectedCategory === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
        )}
      >
        {t("common.allCategories")}
      </button>

      {entries.map((slug) => {
        const active = selectedCategory === slug;
        return (
          <motion.button
            key={slug}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectCategory(active ? null : slug)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-sm transition-colors duration-200",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {labels.category(slug)}
          </motion.button>
        );
      })}
    </div>
  );
}
