import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useEffect, useState } from 'react';

const MIN_SPLASH_MS = 3000;
const EXIT_ANIMATION_MS = 320;

export function useAppSplash() {
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function dismissSplash() {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, MIN_SPLASH_MS);
      });
      if (cancelled) {
        return;
      }

      if (Capacitor.isNativePlatform()) {
        try {
          await SplashScreen.hide({ fadeOutDuration: 200 });
        } catch {
          // Splash plugin may be unavailable in some dev builds.
        }
      }

      setExiting(true);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, EXIT_ANIMATION_MS);
      });
      if (!cancelled) {
        setDone(true);
      }
    }

    void dismissSplash();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    showSplash: !done,
    exiting,
  };
}
