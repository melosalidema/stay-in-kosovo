import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VibeSelector } from "@/components/home/vibe-selector";

describe("VibeSelector", () => {
  it("renders the expected Kosovo exploration vibes", () => {
    render(<VibeSelector />);

    expect(screen.getByText("Nightlife")).toBeInTheDocument();
    expect(screen.getByText("Hidden Gems")).toBeInTheDocument();
    expect(screen.getByText("Local Food")).toBeInTheDocument();
  });
});
