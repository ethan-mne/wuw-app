import { renderHook } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';
import { afterEach, describe, expect, it, vi } from 'vitest';

function createMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.push(cb),
    ),
    removeEventListener: vi.fn(
      (_: string, cb: (e: MediaQueryListEvent) => void) => {
        const i = listeners.indexOf(cb);
        if (i > -1) listeners.splice(i, 1);
      },
    ),
    _listeners: listeners,
    _trigger: (newMatches: boolean) => {
      listeners.forEach((cb) =>
        cb({ matches: newMatches } as MediaQueryListEvent),
      );
    },
  }));
}

describe('useMediaQuery', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  it.each([
    [false, false],
    [true, true],
  ] as const)('returns %s when query matches is %s', (matches, expected) => {
    globalThis.matchMedia = createMatchMedia(matches);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(expected);
  });

  it('cleans up listener on unmount', () => {
    const mockMatchMedia = createMatchMedia(false);
    globalThis.matchMedia = mockMatchMedia;
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    const mediaQueryList = mockMatchMedia.mock.results[0]!.value;
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    unmount();
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
