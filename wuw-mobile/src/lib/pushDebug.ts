import { Capacitor } from '@capacitor/core';

import {
  getIosApnsEnvironment,
  isApnsDeviceToken,
  isLikelyFcmRegistrationToken,
  isValidNativePushToken,
} from './pushToken';
import { API_BASE_URL } from './config';
import { getMobileSessionToken } from './mobileSessionToken';
import {
  getIosApnsTokenForDebug,
  getPushReceivePermission,
  isNativePushPlatform,
  readLocalPushTokensForDebug,
} from './pushNotifications';
import { getLastPushRegistrationError } from './pushNotificationSetup';
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
  storedPushToken: string | null;
  pushToken: string | null;
  apnsToken: string | null;
  apnsEnvironment: string | null;
  pushError: string | null;
  serverPushStatus: { deviceCount: number; platforms: Array<'android' | 'ios'> } | null;
  backendHealth: {
    firebaseConfigured: boolean;
    apnsConfigured: boolean;
    pushConfigured: boolean;
    cronSecretConfigured: boolean;
    fetchError: string | null;
  } | null;
  checks: PushDebugCheck[];
};

const TOKEN_READ_TIMEOUT_MS = 25_000;
const FETCH_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function isPushTokenValid(token: string | null, platform: string): boolean {
  if (!token) {
    return false;
  }
  if (platform === 'ios') {
    return isApnsDeviceToken(token);
  }
  if (platform === 'android') {
    return isLikelyFcmRegistrationToken(token);
  }
  return false;
}

async function fetchBackendHealth(): Promise<PushDebugSnapshot['backendHealth']> {
  if (!API_BASE_URL) {
    return {
      firebaseConfigured: false,
      apnsConfigured: false,
      pushConfigured: false,
      cronSecretConfigured: false,
      fetchError: 'VITE_API_BASE_URL not set',
    };
  }

  try {
    const response = await withTimeout(
      fetch(`${API_BASE_URL}/api/health`),
      FETCH_TIMEOUT_MS,
      null,
    );
    if (!response) {
      return {
        firebaseConfigured: false,
        apnsConfigured: false,
        pushConfigured: false,
        cronSecretConfigured: false,
        fetchError: 'Health check timed out',
      };
    }
    if (!response.ok) {
      return {
        firebaseConfigured: false,
        apnsConfigured: false,
        pushConfigured: false,
        cronSecretConfigured: false,
        fetchError: `HTTP ${response.status}`,
      };
    }
    const json = (await response.json()) as {
      push?: {
        firebaseConfigured?: boolean;
        apnsConfigured?: boolean;
        pushConfigured?: boolean;
        cronSecretConfigured?: boolean;
      };
    };
    return {
      firebaseConfigured: Boolean(json.push?.firebaseConfigured),
      apnsConfigured: Boolean(json.push?.apnsConfigured),
      pushConfigured: Boolean(json.push?.pushConfigured),
      cronSecretConfigured: Boolean(json.push?.cronSecretConfigured),
      fetchError: null,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      firebaseConfigured: false,
      apnsConfigured: false,
      pushConfigured: false,
      cronSecretConfigured: false,
      fetchError: msg,
    };
  }
}

function buildChecks(input: {
  native: boolean;
  platform: string;
  permission: string | null;
  pushToken: string | null;
  apnsToken: string | null;
  pushError: string | null;
  sessionToken: string | null;
  serverPushStatus: PushDebugSnapshot['serverPushStatus'];
  backendHealth: PushDebugSnapshot['backendHealth'];
}): PushDebugCheck[] {
  const checks: PushDebugCheck[] = [];
  const pushValid = isPushTokenValid(input.pushToken, input.platform);

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
    const regErr = getLastPushRegistrationError();
    const apnsOk = Boolean(input.apnsToken && isApnsDeviceToken(input.apnsToken));
    checks.push({
      id: 'apns-token',
      label: 'APNs device token (iOS)',
      status: !input.native ? 'na' : apnsOk ? 'ok' : 'fail',
      detail: apnsOk
        ? `Received from Apple — sent directly to backend (env: ${getIosApnsEnvironment()})`
        : regErr
          ? `Registration error: ${regErr}`
          : 'Missing — real iPhone, notifications allowed, Push capability on App ID com.winuwatch.wuwapp',
    });
  }

  const tokenLabel =
    input.platform === 'ios' ? 'Push token (APNs, registered on server)' : 'FCM registration token';
  checks.push({
    id: 'push-token',
    label: tokenLabel,
    status: !input.native ? 'na' : pushValid ? 'ok' : 'fail',
    detail: pushValid
      ? input.platform === 'ios'
        ? '64-char APNs token — valid for direct APNs send'
        : 'Valid shape for firebase-admin'
      : input.pushError ?? 'Missing or invalid push token',
  });

  checks.push({
    id: 'jwt',
    label: 'Mobile session JWT',
    status: input.sessionToken ? 'ok' : 'warn',
    detail: input.sessionToken
      ? 'Present in localStorage'
      : 'Sign in via OTP to register push on server',
  });

  if (input.platform === 'ios' && input.backendHealth?.fetchError) {
    checks.push({
      id: 'backend-reachable',
      label: 'Backend reachable from phone',
      status: 'warn',
      detail: `Health fetch failed: ${input.backendHealth.fetchError}`,
    });
  }

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
      detail:
        'deviceCount=0 — tap Re-register on server, or use Remind me (registers token + draw alert together)',
    });
  }

  checks.push({
    id: 'draw-alert-flow',
    label: 'Draw reminder eligibility',
    status:
      !input.native
        ? 'na'
        : input.serverPushStatus && input.serverPushStatus.deviceCount > 0
          ? 'ok'
          : 'warn',
    detail:
      'Production cron notifies users with Remind me enabled for a competition and a valid push token in the database.',
  });

  if (!input.backendHealth) {
    checks.push({
      id: 'backend-push',
      label: 'Backend push transport',
      status: 'warn',
      detail: 'Health check not run',
    });
  } else if (input.backendHealth.fetchError) {
    checks.push({
      id: 'backend-push',
      label: 'Backend push transport',
      status: 'fail',
      detail: input.backendHealth.fetchError,
    });
  } else if (input.platform === 'ios') {
    checks.push({
      id: 'backend-apns',
      label: 'Backend APNS_* (iOS direct)',
      status: input.backendHealth.apnsConfigured ? 'ok' : 'fail',
      detail: input.backendHealth.apnsConfigured
        ? 'APNs .p8 configured on server (Render)'
        : 'Not configured — set APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8 on Render',
    });
  } else if (input.platform === 'android') {
    checks.push({
      id: 'backend-firebase',
      label: 'Backend FIREBASE_SERVICE_ACCOUNT_JSON',
      status: input.backendHealth.firebaseConfigured ? 'ok' : 'fail',
      detail: input.backendHealth.firebaseConfigured
        ? 'Configured on server (Render)'
        : 'Not configured — Android pushes will be skipped',
    });
  } else {
    checks.push({
      id: 'backend-push',
      label: 'Backend push configured',
      status: input.backendHealth.pushConfigured ? 'ok' : 'fail',
      detail: input.backendHealth.pushConfigured
        ? 'APNs and/or Firebase configured'
        : 'Configure APNS_* and/or FIREBASE_SERVICE_ACCOUNT_JSON',
    });
  }

  return checks;
}

async function fetchServerPushStatus(): Promise<PushDebugSnapshot['serverPushStatus']> {
  return withTimeout(getPushDeviceStatusFromServer(), FETCH_TIMEOUT_MS, null);
}

export async function collectPushDebugSnapshot(): Promise<PushDebugSnapshot> {
  const platform = Capacitor.getPlatform();
  const native = isNativePushPlatform();
  const permission = await getPushReceivePermission();
  const sessionToken = getMobileSessionToken();
  const storedPushToken = getStoredPushDeviceToken();

  const tokenReadFallback = {
    pushToken: storedPushToken,
    apnsToken: getIosApnsTokenForDebug(),
    pushError: !native
      ? 'Not a native app'
      : permission !== 'granted'
        ? `Notifications: ${permission ?? 'unknown'}`
        : storedPushToken && isValidNativePushToken(storedPushToken, platform === 'ios' ? 'ios' : 'android')
          ? null
          : 'Still reading push tokens — tap Refresh',
  };

  const [tokenRead, backendHealth, serverPushStatus] = await Promise.all([
    native && permission === 'granted'
      ? withTimeout(readLocalPushTokensForDebug(), TOKEN_READ_TIMEOUT_MS, {
          ...tokenReadFallback,
          pushError:
            tokenReadFallback.pushError ??
            'Token read timed out — tap Re-register on server, then Refresh',
        })
      : Promise.resolve({
          pushToken: null as string | null,
          apnsToken: null as string | null,
          pushError: tokenReadFallback.pushError,
        }),
    fetchBackendHealth(),
    sessionToken ? fetchServerPushStatus() : Promise.resolve(null),
  ]);

  const pushToken = tokenRead.pushToken ?? storedPushToken;
  const apnsToken = tokenRead.apnsToken ?? getIosApnsTokenForDebug();
  const pushError =
    pushToken && isPushTokenValid(pushToken, platform) ? null : tokenRead.pushError;

  const checks = buildChecks({
    native,
    platform,
    permission,
    pushToken,
    apnsToken,
    pushError,
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
    storedPushToken,
    pushToken,
    apnsToken,
    apnsEnvironment: platform === 'ios' ? getIosApnsEnvironment() : null,
    pushError,
    serverPushStatus,
    backendHealth,
    checks,
  };
}
