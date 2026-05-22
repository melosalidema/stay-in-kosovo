import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AppI18nProvider } from "@/i18n/i18n-provider";

describe("LanguageSwitcher", () => {
  it("switches between English and Albanian", async () => {
    render(
      <AppI18nProvider>
        <LanguageSwitcher />
      </AppI18nProvider>
    );

    fireEvent.change(screen.getByRole("combobox", { name: /language/i }), { target: { value: "sq" } });

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("sq");
    });
  });
});
