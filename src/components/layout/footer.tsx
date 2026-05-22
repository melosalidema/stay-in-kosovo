"use client";

import { Map, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="section-band border-t border-border bg-muted/40">
      <div className="page-shell grid gap-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Map className="h-4 w-4" />
            </span>
            {t("app.name")}
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("footer.description")}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("footer.aiTitle")}
          </p>
          <p className="text-muted-foreground">{t("footer.aiText")}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t("footer.productionTitle")}
          </p>
          <p className="text-muted-foreground">{t("footer.productionText")}</p>
        </div>
      </div>
    </footer>
  );
}
