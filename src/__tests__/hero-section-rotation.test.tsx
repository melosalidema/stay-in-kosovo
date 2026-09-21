import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/home/hero-section";
import { places } from "@/data/kosovo-data";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & Record<string, unknown>) => {
    const imageProps: Record<string, unknown> = { ...props };
    delete imageProps.fill;
    delete imageProps.priority;
    delete imageProps.sizes;
    delete imageProps.alt;
    delete imageProps.src;
    delete imageProps.loader;
    delete imageProps.unoptimized;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={String(props.alt ?? "")} data-testid="hero-image" src={String(props.src ?? "")} {...imageProps} />
    );
  }
}));

vi.mock("@/hooks/use-geolocation", () => ({
  useGeolocation: () => ({
    requestLocation: vi.fn(),
    loading: false,
    error: null
  })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

describe("HeroSection", () => {
  it("renders the hero imagery and editorial copy", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getAllByTestId("hero-image").length).toBeGreaterThan(0);
    expect(screen.getByText("hero.eyebrow")).toBeInTheDocument();
    expect(screen.getByText("hero.title")).toBeInTheDocument();
    expect(screen.getByText("hero.description")).toBeInTheDocument();
    expect(screen.getByText("hero.exploreNow")).toBeInTheDocument();
    expect(screen.getByText("hero.planDay")).toBeInTheDocument();
  });

  it("leads with the featured Government of Kosovo photograph", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getByText("Government of Kosovo")).toBeInTheDocument();
    expect(screen.getByText("/ Pristina")).toBeInTheDocument();
  });

  it("still renders a secondary frame when there are no places to feature", () => {
    render(<HeroSection featuredPlaces={[]} />);

    // The lead is the fixed featured photograph; the offset frame falls back
    // to the generic Kosovo image rather than disappearing.
    expect(screen.getAllByTestId("hero-image").length).toBe(2);
    expect(screen.getByText("Government of Kosovo")).toBeInTheDocument();
  });
});
