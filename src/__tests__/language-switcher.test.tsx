import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AppI18nProvider } from "@/i18n/i18n-provider";

function openMenu() {
  const trigger = screen.getByRole("button", { name: /language/i });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return trigger;
}

describe("LanguageSwitcher", () => {
  it("shows the active language on the trigger", () => {
    render(
      <AppI18nProvider>
        <LanguageSwitcher />
      </AppI18nProvider>
    );

    expect(screen.getByRole("button", { name: /language/i })).toHaveTextContent("English");
  });

  it("opens a menu listing every supported language", async () => {
    render(
      <AppI18nProvider>
        <LanguageSwitcher />
      </AppI18nProvider>
    );

    openMenu();

    expect(await screen.findByRole("menuitem", { name: /Shqip/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /English/i })).toBeInTheDocument();
  });

  it("switches to Albanian when chosen", async () => {
    render(
      <AppI18nProvider>
        <LanguageSwitcher />
      </AppI18nProvider>
    );

    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: /Shqip/i }));

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("sq");
    });
  });
});
