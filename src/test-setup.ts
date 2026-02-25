/**
 * Test setup: mock browser APIs not available in jsdom.
 */
import { beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof ResizeObserver === 'undefined') {
    const noop = (): void => { return; };
    globalThis.ResizeObserver = class ResizeObserver {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    };
  }

  if (typeof window.matchMedia === 'undefined') {
    const noop = (): void => { return; };
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
      }),
      writable: true,
    });
  }
});
