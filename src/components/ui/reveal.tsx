"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * One observer shared by every revealed element on the page.
 * Creating an IntersectionObserver per card would be wasteful — the browser
 * is happy to watch hundreds of targets from a single instance.
 */
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          sharedObserver?.unobserve(entry.target);
        }
      },
      {
        // Fire once a tenth of the card is showing, and slightly before the
        // very bottom of the viewport so the motion finishes as it settles.
        threshold: 0.1,
        rootMargin: "0px 0px -6% 0px"
      }
    );
  }

  return sharedObserver;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  /** Stagger, in milliseconds, for items revealed as a group. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The hidden state is applied here rather than in the markup on purpose:
  // the server renders the element visible, so if JavaScript never runs the
  // content is still readable. useLayoutEffect runs before the first paint,
  // so there is no flash of visible-then-hidden.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (prefersReducedMotion()) return;

    const observer = getObserver();
    if (!observer) return;

    element.classList.add("reveal");
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      element.classList.remove("reveal", "is-visible");
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
