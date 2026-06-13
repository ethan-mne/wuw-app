import { Capacitor } from '@capacitor/core';
import OneSignal from '@onesignal/capacitor-plugin';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim() ?? '';

let oneSignalInitialized = false;
let initPromise: Promise<boolean> | null = null;

export function hasOneSignalMobileConfig(): boolean {
  return ONESIGNAL_APP_ID.length > 0;
}

export async function initOneSignal(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !hasOneSignalMobileConfig()) {
    return false;
  }
  if (oneSignalInitialized) {
    return true;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await OneSignal.initialize(ONESIGNAL_APP_ID);
      oneSignalInitialized = true;
      return true;
    } catch {
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export type OneSignalPermissionResult =
  | { ok: true; granted: boolean }
  | { ok: false; reason: 'sdk_unavailable' | 'request_failed'; detail?: string };

export async function requestOneSignalPermission(): Promise<OneSignalPermissionResult> {
  if (!(await initOneSignal())) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  try {
    const granted = await OneSignal.Notifications.requestPermission(true);
    return { ok: true, granted: Boolean(granted) };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: 'request_failed', detail };
  }
}

export type OneSignalSubscriptionResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; reason: 'sdk_unavailable' | 'missing_subscription_id' };

export async function getOneSignalSubscriptionId(options?: {
  timeoutMs?: number;
}): Promise<OneSignalSubscriptionResult> {
  if (!(await initOneSignal())) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  const current = (await OneSignal.User.pushSubscription.getIdAsync())?.trim() ?? '';
  if (current) {
    return { ok: true, subscriptionId: current };
  }

  const timeoutMs = options?.timeoutMs ?? 15_000;
  return new Promise<OneSignalSubscriptionResult>((resolve) => {
    const onChange = (state: { current?: { id?: string | null } | null }) => {
      const nextId = state.current?.id?.trim() ?? '';
      if (!nextId) {
        return;
      }
      window.clearTimeout(timer);
      OneSignal.User.pushSubscription.removeEventListener('change', onChange);
      resolve({ ok: true, subscriptionId: nextId });
    };

    OneSignal.User.pushSubscription.addEventListener('change', onChange);

    const timer = window.setTimeout(() => {
      OneSignal.User.pushSubscription.removeEventListener('change', onChange);
      resolve({ ok: false, reason: 'missing_subscription_id' });
    }, timeoutMs);
  });
}
