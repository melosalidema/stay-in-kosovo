import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PlaceCard } from "@/components/discovery/place-card";
import { Reveal } from "@/components/ui/reveal";
import { places } from "@/data/kosovo-data";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const rest: Record<string, unknown> = { ...props };
    delete rest.fill;
    delete rest.priority;
    delete rest.sizes;
    delete rest.loader;
    delete rest.unoptimized;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={String(props.alt ?? "")} src={String(props.src ?? "")} {...rest} />;
  }
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock("@/i18n/use-localized-labels", () => ({
  useLocalizedLabels: () => ({
    vibe: (v: string) => v,
    category: (c: string) => c,
    transport: (t: string) => t,
    availability: (a: string) => a
  })
}));

describe("liquid glass surfaces", () => {
  it("renders a place card as a glass panel", () => {
    const { container } = render(<PlaceCard place={places[0]} />);

    const card = container.querySelector("article");
    expect(card).not.toBeNull();
    expect(card).toHaveClass("glass-panel");
    expect(card).toHaveClass("glass-panel-strong");
  });

  it("keeps place card content alongside the glass treatment", () => {
    render(<PlaceCard place={places[0]} />);

    expect(screen.getByRole("heading", { name: places[0].title })).toBeInTheDocument();
    expect(screen.getByText(places[0].rating)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "placeCard.save" })).toBeInTheDocument();
  });
});

describe("Reveal", () => {
  it("does not hide content in the server-rendered markup", () => {
    // The hidden state is applied by useLayoutEffect, never in the markup, so
    // the content stays readable when JavaScript does not run.
    const html = renderToString(
      <Reveal>
        <p>Always readable</p>
      </Reveal>
    );

    expect(html).toContain("Always readable");
    expect(html).not.toContain("reveal");
  });

  it("arms the animation once mounted in the browser", () => {
    const { container } = render(
      <Reveal>
        <p>Armed</p>
      </Reveal>
    );

    expect(container.firstElementChild).toHaveClass("reveal");
  });

  it("accepts a stagger delay", () => {
    const { container } = render(
      <Reveal delay={140}>
        <p>Staggered</p>
      </Reveal>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--reveal-delay")).toBe("140ms");
  });
});
