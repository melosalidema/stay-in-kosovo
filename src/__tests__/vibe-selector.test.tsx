import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VibeSelector } from "@/components/home/vibe-selector";

describe("VibeSelector", () => {
  it("renders the mood-led exploration labels", () => {
    render(<VibeSelector />);

    expect(screen.getByText("A night out")).toBeInTheDocument();
    expect(screen.getAllByText("Hidden gems").length).toBeGreaterThan(0);
    expect(screen.getByText("Something delicious")).toBeInTheDocument();
  });

  it("renders every mood as a selectable control", () => {
    render(<VibeSelector />);

    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(14);
  });
});
