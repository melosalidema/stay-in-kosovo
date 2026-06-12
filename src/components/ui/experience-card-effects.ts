import type { CSSProperties } from "react";

import type { PlaceDTO } from "@/types";

type SurgeStyle = CSSProperties &
  Record<"--surge-duration" | "--surge-alpha" | "--surge-rgb" | "--surge-glow", string>;

type DiscoveryStyle = CSSProperties &
  Record<"--discover-surge-duration" | "--discover-surge-alpha" | "--discover-surge-rgb", string>;

const discoveryCategoryColors: Record<string, string> = {
  restaurants: "185 101 73",
  cafes: "180 121 72",
  nightlife: "156 93 126",
  nature: "58 125 93",
  culture: "53 116 143",
  events: "111 99 148",
  parks: "46 132 118"
};

function clampScore(score: number) {
  return Math.min(Math.max(score, 1), 100);
}

function surgeColor(intensity: number) {
  if (intensity >= 90) return "190 69 87";
  if (intensity >= 70) return "188 118 51";
  return "32 126 116";
}

export function pulseIntensityTone(intensity: number) {
  const score = clampScore(intensity);

  if (score >= 90) return "rose";
  if (score >= 70) return "amber";
  return "green";
}

export function pulseZoneSurgeStyle(intensity: number): SurgeStyle {
  const score = clampScore(intensity);
  const ratio = score / 100;

  return {
    "--surge-duration": `${2.8 - ratio * 1.05}s`,
    "--surge-alpha": `${0.13 + ratio * 0.2}`,
    "--surge-glow": `${0.18 + ratio * 0.22}`,
    "--surge-rgb": surgeColor(score)
  };
}

export function pulseZoneCardStyle(intensity: number, hovered: boolean): SurgeStyle {
  const score = clampScore(intensity);
  const ratio = score / 100;
  const color = surgeColor(score);
  const alpha = 0.13 + ratio * 0.2;

  return {
    ...pulseZoneSurgeStyle(score),
    animation: `pulse-card-breathe ${2.8 - ratio * 1.05}s ease-in-out infinite`,
    backgroundImage: `radial-gradient(circle at 92% 8%, rgb(${color} / ${hovered ? alpha + 0.12 : alpha}) 0, transparent ${hovered ? 34 : 24}%)`,
    borderColor: hovered ? `rgb(${color} / 0.72)` : `rgb(${color} / ${0.22 + ratio * 0.22})`,
    boxShadow: hovered
      ? `0 22px 50px rgb(22 31 44 / 0.28), 0 0 0 1px rgb(${color} / 0.42), 0 0 ${24 + ratio * 24}px rgb(${color} / ${0.2 + ratio * 0.18})`
      : `0 0 0 1px rgb(${color} / ${0.14 + ratio * 0.14}), 0 0 ${8 + ratio * 14}px rgb(${color} / ${0.08 + ratio * 0.1})`,
    transformOrigin: "center",
    transform: hovered ? "translateY(-6px) scale(1.035)" : "translateY(0) scale(1)",
    transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, filter 220ms ease",
    willChange: "transform, box-shadow, filter",
    zIndex: hovered ? 20 : 1
  };
}

export function homePulseCardStyle(intensity: number, hovered: boolean): SurgeStyle {
  const score = clampScore(intensity);
  const ratio = score / 100;
  const color = surgeColor(score);
  const alpha = 0.06 + ratio * 0.1;

  return {
    ...pulseZoneSurgeStyle(score),
    "--surge-alpha": `${alpha}`,
    "--surge-glow": `${0.12 + ratio * 0.12}`,
    backgroundImage: `radial-gradient(circle at 92% 8%, rgb(${color} / ${hovered ? alpha + 0.08 : alpha}) 0, transparent ${hovered ? 32 : 24}%)`,
    borderColor: hovered ? `rgb(${color} / 0.38)` : `rgb(${color} / ${0.14 + ratio * 0.12})`,
    boxShadow: hovered
      ? `0 18px 38px rgb(22 31 44 / 0.18), 0 0 0 1px rgb(${color} / 0.2)`
      : `0 10px 28px rgb(22 31 44 / 0.08), 0 0 0 1px rgb(${color} / 0.08)`,
    transformOrigin: "center",
    transform: hovered ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
    transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, filter 220ms ease",
    willChange: "transform, box-shadow, filter",
    zIndex: hovered ? 12 : 1
  };
}

export function discoveryPlaceCardStyle(place: PlaceDTO, hovered: boolean): DiscoveryStyle {
  const score = clampScore(place.popularityScore || Math.round(place.rating * 18));
  const ratio = score / 100;
  const color = discoveryCategoryColors[place.category.slug] ?? "46 132 118";
  const alpha = 0.018 + ratio * 0.025;

  return {
    "--discover-surge-duration": `${6.2 - ratio * 1.1}s`,
    "--discover-surge-alpha": `${alpha}`,
    "--discover-surge-rgb": color,
    backgroundImage: `radial-gradient(circle at 88% 4%, rgb(${color} / ${hovered ? alpha + 0.028 : alpha}) 0, transparent ${hovered ? 30 : 24}%)`,
    borderColor: hovered ? `rgb(${color} / 0.2)` : "hsl(var(--border))",
    boxShadow: hovered
      ? `0 18px 34px rgb(22 31 44 / 0.11), 0 0 0 1px rgb(${color} / 0.1)`
      : "0 8px 22px rgb(22 31 44 / 0.055)",
    transform: hovered ? "translateY(-3px)" : "translateY(0)",
    transformOrigin: "center",
    transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, filter 220ms ease",
    willChange: "transform, box-shadow, filter",
    zIndex: hovered ? 8 : 1
  };
}

export const experienceCardKeyframes = `
  @keyframes pulse-card-breathe {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.055); }
  }

  @keyframes pulse-card-halo {
    0%, 100% {
      opacity: calc(var(--surge-alpha) * 0.58);
      transform: scale(0.99);
    }
    50% {
      opacity: var(--surge-glow);
      transform: scale(1.018);
    }
  }

  @keyframes pulse-zone-dot {
    0%, 100% { transform: scale(0.72); opacity: calc(var(--surge-alpha) * 0.75); }
    50% { transform: scale(1.65); opacity: calc(var(--surge-alpha) * 1.28); }
  }
`;
