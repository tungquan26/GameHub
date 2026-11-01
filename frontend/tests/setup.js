import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Node 26 có Web Storage riêng; dùng Storage thật của JSDOM cho môi trường trình duyệt.
for (const area of ["localStorage", "sessionStorage"]) {
  Object.defineProperty(globalThis, area, { configurable: true, value: globalThis.jsdom.window[area] });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  window.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
