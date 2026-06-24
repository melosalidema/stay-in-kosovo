import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FloatingNavbar } from "@/components/layout/floating-navbar";

type Role = "USER" | "BUSINESS_OWNER" | "ADMIN";

const { mockSession } = vi.hoisted(() => ({
  mockSession: { current: undefined as { user: { role: Role } } | undefined }
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: mockSession.current })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock("@/components/layout/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />
}));

function setSession(role: Role | null) {
  mockSession.current = role === null ? undefined : { user: { role } };
}

const publicItems = ["nav.pulse", "nav.discover", "nav.itinerary", "nav.mobility"];
const businessItem = "nav.business";
const adminItem = "nav.admin";

function navLinksFor(label: string) {
  return screen.queryAllByRole("link", { name: label });
}

describe("FloatingNavbar role-based visibility", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined
      })
    });
  });

  afterEach(() => {
    mockSession.current = undefined;
    window.localStorage.clear();
  });

  it("hides Business and Admin for guests (not logged in)", () => {
    setSession(null);
    render(<FloatingNavbar />);

    expect(navLinksFor(businessItem)).toHaveLength(0);
    expect(navLinksFor(adminItem)).toHaveLength(0);
    publicItems.forEach((label) => {
      expect(navLinksFor(label).length).toBeGreaterThan(0);
    });
  });

  it("hides Business and Admin for regular (USER) accounts", () => {
    setSession("USER");
    render(<FloatingNavbar />);

    expect(navLinksFor(businessItem)).toHaveLength(0);
    expect(navLinksFor(adminItem)).toHaveLength(0);
    publicItems.forEach((label) => {
      expect(navLinksFor(label).length).toBeGreaterThan(0);
    });
  });

  it("shows Business but hides Admin for BUSINESS_OWNER accounts", () => {
    setSession("BUSINESS_OWNER");
    render(<FloatingNavbar />);

    expect(navLinksFor(businessItem).length).toBeGreaterThan(0);
    expect(navLinksFor(adminItem)).toHaveLength(0);
    publicItems.forEach((label) => {
      expect(navLinksFor(label).length).toBeGreaterThan(0);
    });
  });

  it("shows Admin but hides Business for ADMIN accounts", () => {
    setSession("ADMIN");
    render(<FloatingNavbar />);

    expect(navLinksFor(businessItem)).toHaveLength(0);
    expect(navLinksFor(adminItem).length).toBeGreaterThan(0);
    publicItems.forEach((label) => {
      expect(navLinksFor(label).length).toBeGreaterThan(0);
    });
  });

  it("keeps public navigation items visible across all roles", () => {
    (["USER", "BUSINESS_OWNER", "ADMIN"] as Role[]).forEach((role) => {
      setSession(role);
      const { unmount } = render(<FloatingNavbar />);
      publicItems.forEach((label) => {
        expect(navLinksFor(label).length).toBeGreaterThan(0);
      });
      unmount();
    });
  });
});
