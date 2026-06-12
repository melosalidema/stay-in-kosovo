import { act, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("HeroSection image rotation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances the visible hero background every five seconds", () => {
    render(<HeroSection featuredPlaces={places.slice(0, 2)} />);

    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("Germia Park")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByText("Germia Park")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getByText("Soma Book Station")).toBeInTheDocument();
  });
});
