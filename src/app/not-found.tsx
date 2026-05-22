"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="section-band">
      <div className="page-shell grid min-h-[60vh] place-items-center text-center">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-semibold uppercase text-primary">404</p>
          <h1 className="text-3xl font-bold">{t("notFound.title")}</h1>
          <p className="text-muted-foreground">{t("notFound.text")}</p>
          <Button asChild>
            <Link href="/discover">{t("notFound.action")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
