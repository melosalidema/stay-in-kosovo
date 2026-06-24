"use client";

import dynamic from "next/dynamic";

import type { MobilityRoute, PlaceDTO } from "@/types";

type MobilityRouteMapProps = {
  from?: PlaceDTO;
  to?: PlaceDTO;
  route?: MobilityRoute;
  className?: string;
};

const MobilityRouteMapImpl = dynamic(
  () =>
    import("@/components/mobility/route-map-impl").then((mod) => ({ default: mod.MobilityRouteMapImpl })),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[520px] w-full place-items-center bg-slate-950 text-sm text-white/60">
        Loading map…
      </div>
    )
  }
);

export function MobilityRouteMap(props: MobilityRouteMapProps) {
  return <MobilityRouteMapImpl {...props} />;
}
