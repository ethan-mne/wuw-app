import { Capacitor } from '@capacitor/core';

import { isLikelyFcmRegistrationToken } from './fcmToken';
import { API_BASE_URL } from './config';
import { getMobileSessionToken } from './mobileSessionToken';
import {
  getPushReceivePermission,
  isNativePushPlatform,
  readLocalPushTokensForDebug,
} from './pushNotifications';
import { getStoredPushDeviceToken } from './pushStorage';
import { getPushDeviceStatusFromServer } from '../services/pushDeviceApi';

export type PushDebugCheckStatus = 'ok' | 'warn' | 'fail' | 'na';

export type PushDebugCheck = {
  id: string;
  label: string;
  status: PushDebugCheckStatus;
  detail: string;
};

export type PushDebugSnapshot = {
  platform: string;
  apiBaseUrl: string;
  native: boolean;
  permission: string | null;
  sessionToken: string | null;
  storedFcmToken: string | null;
  fcmToken: string | null;
  apnsToken: string | null;
  fcmError: string | null;
  serverPushStatus: { deviceCount: number; platforms: Array<'android' | 'ios'> } | null;
  backendHealth: {
    firebaseConfigured: boolean;
    cronSecretConfigured: boolean;
    fetchError: string | null;
  } | null;
  checks: PushDebugCheck[];
};

async function fetchBackendHealth(): Promise<PushDebugSnapshot['backendHealth']> {
  if (!API_BASE_URL) {
    return {
      firebaseConfigured: false,
      cronSecretConfigured: false,
      fetchError: 'VITE_API_BASE_URL not set',
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      return {
        firebaseConfigured: false,
        cronSecretConfigured: false,
        fetchError: `HTTP ${response.status}`,
      };
    }
    const json = (await response.json()) as {
      push?: { firebaseConfigured?: boolean; cronSecretConfigured?: boolean };
    };
    return {
      firebaseConfigured: Boolean(json.push?.firebaseConfigured),
      cronSecretConfigured: Boolean(json.push?.cronSecretConfigured),
      fetchError: null,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      firebaseConfigured: false,
      cronSecretConfigured: false,
      fetchError: msg,
    };
  }
}

function buildChecks(input: {
  native: boolean;
  platform: string;
  permission: string | null;
  fcmToken: string | null;
  fcmError: string | null;
  sessionToken: string | null;
  serverPushStatus: PushDebugSnapshot['serverPushStatus'];
  backendHealth: PushDebugSnapshot['backendHealth'];
}): PushDebugCheck[] {
  const checks: PushDebugCheck[] = [];

  checks.push({
    id: 'native',
    label: 'Native app (Capacitor)',
    status: input.native ? 'ok' : 'fail',
    detail: input.native
      ? `Platform: ${input.platform}`
      : 'Web preview — push tokens require a real device build',
  });

  if (input.permission === null) {
    checks.push({
      id: 'permission',
      label: 'Notification permission',
      status: 'na',
      detail: 'Not applicable on web',
    });
  } else if (input.permission === 'granted') {
    checks.push({
      id: 'permission',
      label: 'Notification permission',
      status: 'ok',
      detail: 'granted',
    });
  } else if (input.permission === 'denied') {
    checks.push({
      id: 'permission',
      label: 'Notification permission',
      status: 'fail',
      detail: 'denied — open Settings → Winuwatch → Notifications',
    });
  } else {
    checks.push({
      id: 'permission',
      label: 'Notification permission',
      status: 'warn',
      detail: input.permission,
    });
  }

  if (input.platform === 'ios') {
    const plistOk =
      input.native &&
      input.permission === 'granted' &&
      Boolean(input.fcmToken && isLikelyFcmRegistrationToken(input.fcmToken));
    checks.push({
      id: 'google-service-plist',
      label: 'GoogleService-Info.plist (iOS, indirect)',
      status: !input.native ? 'na' : plistOk ? 'ok' : 'fail',
      detail: plistOk
        ? 'FCM token obtained — plist likely bundled correctly'
        : input.fcmError ??
          'No valid FCM token — add GoogleService-Info.plist and npm run ios:sync',
    });

    checks.push({
      id: 'apns-firebase',
      label: 'APNs key in Firebase (indirect)',
      status: !input.native ? 'na' : plistOk ? 'warn' : 'fail',
      detail:
        'Cannot verify from the app. If FCM token is OK, upload the .p8 key in Firebase Console (dev + prod). Confirm with a real push or draw-reminder:test:prod.',
    });
  } else if (input.platform === 'android') {
    checks.push({
      id: 'google-service-plist',
      label: 'GoogleService-Info.plist (iOS)',
      status: 'na',
      detail: 'Android uses google-services.json',
    });
    checks.push({
      id: 'apns-firebase',
      label: 'APNs (iOS only)',
      status: 'na',
      detail: 'Not applicable on Android',
    });
  } else {
    checks.push({
      id: 'google-service-plist',
      label: 'GoogleService-Info.plist',
      status: 'na',
      detail: 'Native iOS only',
    });
    checks.push({
      id: 'apns-firebase',
      label: 'APNs in Firebase',
      status: 'na',
      detail: 'Native iOS only',
    });
  }

  const fcmValid = Boolean(input.fcmToken && isLikelyFcmRegistrationToken(input.fcmToken));
  checks.push({
    id: 'fcm-token',
    label: 'FCM registration token',
    status: !input.native ? 'na' : fcmValid ? 'ok' : 'fail',
    detail: fcmValid
      ? 'Valid shape for firebase-admin'
      : input.fcmError ?? 'Missing or invalid FCM token',
  });

  checks.push({
    id: 'jwt',
    label: 'Mobile session JWT',
    status: input.sessionToken ? 'ok' : 'warn',
    detail: input.sessionToken ? 'Present in localStorage' : 'Sign in via OTP to register push on server',
  });

  if (!input.sessionToken) {
    checks.push({
      id: 'server-registered',
      label: 'Token registered on backend',
      status: 'warn',
      detail: 'Log in first',
    });
  } else if (!input.serverPushStatus) {
    checks.push({
      id: 'server-registered',
      label: 'Token registered on backend',
      status: 'warn',
      detail: 'Could not fetch push-token status',
    });
  } else if (input.serverPushStatus.deviceCount > 0) {
    checks.push({
      id: 'server-registered',
      label: 'Token registered on backend',
      status: 'ok',
      detail: `${input.serverPushStatus.deviceCount} device(s): ${input.serverPushStatus.platforms.join(', ') || '—'}`,
    });
  } else {
    checks.push({
      id: 'server-registered',
      label: 'Token registered on backend',
      status: 'fail',
      detail: 'deviceCount=0 — tap Re-register on server',
    });
  }

  if (!input.backendHealth) {
    checks.push({
      id: 'backend-firebase',
      label: 'Backend FIREBASE_SERVICE_ACCOUNT_JSON',
      status: 'warn',
      detail: 'Health check not run',
    });
  } else if (input.backendHealth.fetchError) {
    checks.push({
      id: 'backend-firebase',
      label: 'Backend FIREBASE_SERVICE_ACCOUNT_JSON',
      status: 'fail',
      detail: input.backendHealth.fetchError,
    });
  } else if (input.backendHealth.firebaseConfigured) {
    checks.push({
      id: 'backend-firebase',
      label: 'Backend FIREBASE_SERVICE_ACCOUNT_JSON',
      status: 'ok',
      detail: 'Configured on server (Render)',
    });
  } else {
    checks.push({
      id: 'backend-firebase',
      label: 'Backend FIREBASE_SERVICE_ACCOUNT_JSON',
      status: 'fail',
      detail: 'Not configured — pushes will be skipped server-side',
    });
  }

  return checks;
}

export async function collectPushDebugSnapshot(): Promise<PushDebugSnapshot> {
  const platform = Capacitor.getPlatform();
  const native = isNativePushPlatform();
  const permission = await getPushReceivePermission();
  const sessionToken = getMobileSessionToken();
  const storedFcmToken = getStoredPushDeviceToken();

  const [tokenRead, backendHealth, serverPushStatus] = await Promise.all([
    native && permission === 'granted'
      ? readLocalPushTokensForDebug()
      : Promise.resolve({
          fcm: null as string | null,
          apns: null as string | null,
          fcmError: !native
            ? 'Not a native app'
            : permission !== 'granted'
              ? `Notifications: ${permission ?? 'unknown'}`
              : null,
        }),
    fetchBackendHealth(),
    sessionToken ? getPushDeviceStatusFromServer() : Promise.resolve(null),
  ]);

  const checks = buildChecks({
    native,
    platform,
    permission,
    fcmToken: tokenRead.fcm,
    fcmError: tokenRead.fcmError,
    sessionToken,
    serverPushStatus,
    backendHealth,
  });

  return {
    platform,
    apiBaseUrl: API_BASE_URL,
    native,
    permission,
    sessionToken,
    storedFcmToken,
    fcmToken: tokenRead.fcm,
    apnsToken: tokenRead.apns,
    fcmError: tokenRead.fcmError,
    serverPushStatus,
    backendHealth,
    checks,
  };
}
