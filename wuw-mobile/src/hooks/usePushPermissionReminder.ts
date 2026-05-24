import { useCallback, useEffect, useState } from 'react';

import { getMobileSessionToken } from '../lib/mobileSessionToken';
import {
  enablePushNotifications,
  getPushReceivePermission,
  isNativePushPlatform,
  subscribePushPermissionChanged,
  type PushReceivePermission,
} from '../lib/pushNotifications';

export function usePushPermissionReminder() {
  const [receive, setReceive] = useState<PushReceivePermission | null>(null);
  const [hasSession, setHasSession] = useState(() => Boolean(getMobileSessionToken()));
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const loggedIn = Boolean(getMobileSessionToken());
    setHasSession(loggedIn);

    if (!loggedIn || !isNativePushPlatform()) {
      setReceive(null);
      return;
    }

    setReceive(await getPushReceivePermission());
  }, []);

  useEffect(() => {
    void refresh();
    const unsubPermission = subscribePushPermissionChanged(() => {
      void refresh();
    });
    const onSession = () => {
      void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    window.addEventListener('wuw-mobile-session', onSession);
    window.addEventListener('storage', onSession);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      unsubPermission();
      window.removeEventListener('wuw-mobile-session', onSession);
      window.removeEventListener('storage', onSession);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const visible = hasSession && isNativePushPlatform() && receive !== null && receive !== 'granted';

  const needsSettings = receive === 'denied';

  const enable = async () => {
    setBusy(true);
    try {
      await enablePushNotifications();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return { visible, busy, needsSettings, enable };
}
