"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        previouslyFocused?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      if (focusableElements.length === 0) return;

      const focused = document.activeElement;
      const isFirst = focused === firstElement;
      const isLast = focused === lastElement;

      if (event.shiftKey) {
        if (isFirst) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (isLast) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [containerRef, active]);
}