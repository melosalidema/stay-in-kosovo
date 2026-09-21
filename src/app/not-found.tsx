"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="section-band">
      <div className="page-shell grid min-h-[60vh] place-items-center text-center">
        <div className="max-w-md">
          <p className="eyebrow">404</p>
          <h1 className="display-2 mt-3">{t("notFound.title")}</h1>
          <p className="lede mt-3 text-[0.9375rem] sm:text-base">{t("notFound.text")}</p>
          <Button asChild className="mt-7">
            <Link href="/discover">{t("notFound.action")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
