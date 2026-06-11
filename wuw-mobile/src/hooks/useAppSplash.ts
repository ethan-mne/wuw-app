import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';

const EXIT_ANIMATION_MS = 320;
const MAX_SPLASH_MS = 5000;

type UseAppSplashOptions = {
  disabled?: boolean;
};

export function useAppSplash(options: UseAppSplashOptions = {}) {
  const { disabled = false } = options;
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(disabled);
  const dismissedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hideNativeSplash() {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        await SplashScreen.hide({ fadeOutDuration: 200 });
      } catch {
        // Splash plugin may be unavailable in some dev builds.
      }
    }

    void hideNativeSplash();

    if (disabled) {
      dismissedRef.current = true;
      setDone(true);
      return () => {
        cancelled = true;
      };
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !dismissedRef.current) {
        dismissedRef.current = true;
        setExiting(true);
        window.setTimeout(() => {
          if (!cancelled) {
            setDone(true);
          }
        }, EXIT_ANIMATION_MS);
      }
    }, MAX_SPLASH_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [disabled]);

  const onVideoEnded = useCallback(() => {
    if (disabled) {
      return;
    }
    if (dismissedRef.current) {
      return;
    }
    dismissedRef.current = true;

    setExiting(true);
    window.setTimeout(() => {
      setDone(true);
    }, EXIT_ANIMATION_MS);
  }, [disabled]);

  return {
    showSplash: !done,
    exiting,
    onVideoEnded,
  };
}
