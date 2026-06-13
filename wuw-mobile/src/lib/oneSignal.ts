import { Capacitor } from '@capacitor/core';

type OneSignalPermissionObserverState = {
  permission: boolean;
};

type OneSignalPushSubscriptionObserverState = {
  current?: {
    id?: string | null;
  } | null;
};

type OneSignalSdk = {
  initialize(appId: string): void;
  Notifications: {
    requestPermission(fallbackToSettings: boolean): Promise<boolean>;
    addPermissionObserver(cb: (state: OneSignalPermissionObserverState) => void): void;
    removePermissionObserver(cb: (state: OneSignalPermissionObserverState) => void): void;
  };
  User: {
    pushSubscription: {
      getId(): string | null;
      addObserver(cb: (state: OneSignalPushSubscriptionObserverState) => void): void;
      removeObserver(cb: (state: OneSignalPushSubscriptionObserverState) => void): void;
    };
  };
};

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim() ?? '';

let oneSignalInitialized = false;

function readOneSignalFromWindow(): OneSignalSdk | null {
  const globalObject = window as unknown as {
    OneSignal?: OneSignalSdk;
  };
  const sdk = globalObject.OneSignal;
  if (!sdk) {
    return null;
  }
  return sdk;
}

export function hasOneSignalMobileConfig(): boolean {
  return ONESIGNAL_APP_ID.length > 0;
}

export function initOneSignal(): boolean {
  if (!Capacitor.isNativePlatform() || !hasOneSignalMobileConfig()) {
    return false;
  }
  const sdk = readOneSignalFromWindow();
  if (!sdk) {
    return false;
  }
  if (!oneSignalInitialized) {
    sdk.initialize(ONESIGNAL_APP_ID);
    oneSignalInitialized = true;
  }
  return true;
}

export type OneSignalPermissionResult =
  | { ok: true; granted: boolean }
  | { ok: false; reason: 'sdk_unavailable' | 'request_failed'; detail?: string };

export async function requestOneSignalPermission(): Promise<OneSignalPermissionResult> {
  if (!initOneSignal()) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  const sdk = readOneSignalFromWindow();
  if (!sdk) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  try {
    const granted = await sdk.Notifications.requestPermission(true);
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
  if (!initOneSignal()) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  const sdk = readOneSignalFromWindow();
  if (!sdk) {
    return { ok: false, reason: 'sdk_unavailable' };
  }

  const current = sdk.User.pushSubscription.getId()?.trim() ?? '';
  if (current) {
    return { ok: true, subscriptionId: current };
  }

  const timeoutMs = options?.timeoutMs ?? 15_000;
  return new Promise<OneSignalSubscriptionResult>((resolve) => {
    const onChange = (state: OneSignalPushSubscriptionObserverState) => {
      const nextId = state.current?.id?.trim() ?? '';
      if (!nextId) {
        return;
      }
      window.clearTimeout(timer);
      sdk.User.pushSubscription.removeObserver(onChange);
      resolve({ ok: true, subscriptionId: nextId });
    };

    sdk.User.pushSubscription.addObserver(onChange);

    const timer = window.setTimeout(() => {
      sdk.User.pushSubscription.removeObserver(onChange);
      resolve({ ok: false, reason: 'missing_subscription_id' });
    }, timeoutMs);
  });
}
