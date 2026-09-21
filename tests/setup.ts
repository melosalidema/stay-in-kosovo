import "@testing-library/jest-dom/vitest";

class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

// jsdom has no PointerEvent, so `fireEvent.pointerDown` falls back to a plain
// Event and Radix UI's dropdown/select triggers never see `button === 0` and
// never open. A minimal MouseEvent-backed polyfill is enough for them.
if (typeof globalThis.PointerEvent === "undefined") {
  type PointerInit = MouseEventInit & {
    pointerId?: number;
    pointerType?: string;
    isPrimary?: boolean;
    width?: number;
    height?: number;
    pressure?: number;
    tiltX?: number;
    tiltY?: number;
    twist?: number;
  };

  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly twist: number;

    constructor(type: string, params: PointerInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
    }
  }

  Object.defineProperty(globalThis, "PointerEvent", {
    writable: true,
    configurable: true,
    value: PointerEventPolyfill
  });
}

// Radix also calls these when positioning popovers.
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>;

  if (!proto.hasPointerCapture) {
    proto.hasPointerCapture = function hasPointerCapture() {
      return false;
    };
  }
  if (!proto.setPointerCapture) {
    proto.setPointerCapture = function setPointerCapture() {};
  }
  if (!proto.releasePointerCapture) {
    proto.releasePointerCapture = function releasePointerCapture() {};
  }
  if (!proto.scrollIntoView) {
    proto.scrollIntoView = function scrollIntoView() {};
  }
}
