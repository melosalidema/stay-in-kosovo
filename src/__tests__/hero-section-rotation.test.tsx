import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/home/hero-section";
import { places } from "@/data/kosovo-data";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    const imageProps = { ...props };
    delete imageProps.fill;
    delete imageProps.priority;
    delete imageProps.sizes;
    delete imageProps.alt;
    delete imageProps.src;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={props.alt ?? ""} data-testid="hero-background-image" src={String(props.src ?? "")} {...imageProps} />
    );
  }
}));

vi.mock("@/components/home/kosovo-pulse-map", () => ({
  KosovoPulseMap: () => <div data-testid="kosovo-pulse-map" />
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
  it("renders the hero background image and first place", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getByTestId("hero-background-image")).toBeInTheDocument();
    expect(screen.getByText("hero.eyebrow")).toBeInTheDocument();
    expect(screen.getByText("hero.title")).toBeInTheDocument();
    expect(screen.getByText("hero.description")).toBeInTheDocument();
    expect(screen.getByText("hero.exploreNow")).toBeInTheDocument();
    expect(screen.getByText(places[0].title)).toBeInTheDocument();
  });

  it("renders hero stats based on featured places", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getByText("hero.stats.signals")).toBeInTheDocument();
    expect(screen.getByText("hero.stats.vibes")).toBeInTheDocument();
    expect(screen.getByText("hero.stats.layers")).toBeInTheDocument();
  });

  it("shows pulse map", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getByTestId("kosovo-pulse-map")).toBeInTheDocument();
  });
});
