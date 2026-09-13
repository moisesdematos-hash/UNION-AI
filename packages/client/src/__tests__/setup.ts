import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for React Flow in jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Polyfill DOMMatrixReadOnly if needed by React Flow
if (typeof window.DOMMatrixReadOnly === 'undefined') {
  // @ts-expect-error Mocking DOMMatrixReadOnly for test environment
  window.DOMMatrixReadOnly = class DOMMatrixReadOnly {
    m22 = 1;
  };
}
