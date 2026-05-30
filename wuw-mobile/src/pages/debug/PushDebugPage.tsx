/**
 * TEMPORARY push debug screen — exposes JWT + FCM tokens. Remove before a public store
 * release unless you accept the risk of session token exposure on device.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { MobileFooter } from '../../components/MobileFooter';
import {
  collectPushDebugSnapshot,
  type PushDebugCheckStatus,
  type PushDebugSnapshot,
} from '../../lib/pushDebug';
import {
  enablePushNotifications,
  getPushReceivePermission,
  isNativePushPlatform,
  pushRegisterFailureMessage,
  registerPushForDebug,
} from '../../lib/pushNotifications';

function checkIcon(status: PushDebugCheckStatus): string {
  if (status === 'ok') {
    return '✓';
  }
  if (status === 'warn') {
    return '!';
  }
  if (status === 'fail') {
    return '✗';
  }
  return '—';
}

async function copyText(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

type TokenFieldProps = {
  id: string;
  label: string;
  value: string | null;
  emptyHint: string;
};

function TokenField({ id, label, value, emptyHint }: TokenFieldProps) {
  const [copyLabel, setCopyLabel] = useState('Copy');

  const onCopy = useCallback(async () => {
    if (!value) {
      return;
    }
    const ok = await copyText(value);
    if (ok) {
      setCopyLabel('Copied');
      window.setTimeout(() => setCopyLabel('Copy'), 2000);
    }
  }, [value]);

  return (
    <div className="push-debug-token-block">
      <div className="push-debug-token-header">
        <label className="push-debug-token-label" htmlFor={id}>
          {label}
        </label>
        <button
          type="button"
          className="action-link secondary push-debug-copy-btn"
          disabled={!value}
          onClick={() => void onCopy()}
        >
          {copyLabel}
        </button>
      </div>
      <textarea
        id={id}
        className="push-debug-token-value"
        readOnly
        rows={4}
        value={value ?? ''}
        placeholder={emptyHint}
      />
    </div>
  );
}

export function PushDebugPage() {
  const [snapshot, setSnapshot] = useState<PushDebugSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const snapshotRef = useRef<PushDebugSnapshot | null>(null);
  snapshotRef.current = snapshot;

  const refresh = useCallback(async () => {
    const isFirstLoad = snapshotRef.current === null;
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setRegisterMessage(null);
    try {
      const data = await collectPushDebugSnapshot();
      setSnapshot(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onSession = () => {
      void refresh();
    };
    window.addEventListener('wuw-mobile-session', onSession);
    return () => window.removeEventListener('wuw-mobile-session', onSession);
  }, [refresh]);

  const onAllowNotifications = useCallback(async () => {
    setRequestingPermission(true);
    setRegisterMessage(null);
    try {
      const ok = await enablePushNotifications();
      const receive = await getPushReceivePermission();
      if (ok || receive === 'granted') {
        setRegisterMessage('Notifications allowed — wait up to 50s, then Refresh.');
      } else if (receive === 'denied') {
        setRegisterMessage('Notifications denied — enable them in iOS Settings, then Refresh.');
      } else {
        setRegisterMessage(`Permission: ${receive ?? 'unknown'}. Try again or use Settings.`);
      }
    } finally {
      setRequestingPermission(false);
      await refresh();
    }
  }, [refresh]);

  const onReRegister = useCallback(async () => {
    setRegistering(true);
    setRegisterMessage('Registering…');
    try {
      const result = await registerPushForDebug();
      if (result.ok) {
        setRegisterMessage(`OK — token ${result.tokenPrefix} sent to server`);
      } else if (result.reason === 'not_logged_in') {
        setRegisterMessage('Sign in (OTP) first — server registration needs your session.');
      } else {
        setRegisterMessage(pushRegisterFailureMessage(result));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setRegisterMessage(`Registration failed: ${msg}`);
    } finally {
      setRegistering(false);
      await refresh();
    }
  }, [refresh]);

  return (
    <div className="push-debug-page">
      <header className="push-debug-header">
        <h1>Push debug</h1>
        <p className="push-debug-lead">
          Temporary tool: copy tokens for Firebase test messages or{' '}
          <code>npm run draw-reminder:test:prod</code>. The main app only offers notifications
          after sign-in; use <strong>Allow notifications</strong> here to test APNs/FCM first.
        </p>
        <div className="push-debug-actions">
          {isNativePushPlatform() && snapshot?.permission !== 'granted' ? (
            <button
              type="button"
              className="action-link"
              disabled={loading || refreshing || requestingPermission}
              onClick={() => void onAllowNotifications()}
            >
              {requestingPermission ? 'Requesting…' : 'Allow notifications'}
            </button>
          ) : null}
          <button
            type="button"
            className="action-link"
            disabled={loading || refreshing}
            onClick={() => void refresh()}
          >
            {loading || refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            className="action-link secondary"
            disabled={loading || refreshing || registering}
            onClick={() => void onReRegister()}
          >
            {registering ? 'Registering…' : 'Re-register on server'}
          </button>
        </div>
        {registerMessage ? (
          <p className="push-debug-register-msg" role="status">
            {registerMessage}
          </p>
        ) : null}
      </header>

      {snapshot ? (
        <div
          className={
            refreshing ? 'push-debug-body push-debug-body--refreshing' : 'push-debug-body'
          }
        >
          <section className="push-debug-meta" aria-label="Environment">
            <p>
              <strong>Platform:</strong> {snapshot.platform}
              {snapshot.native ? ' (native)' : ' (web)'}
            </p>
            <p>
              <strong>API:</strong>{' '}
              {snapshot.apiBaseUrl || <em>VITE_API_BASE_URL not set</em>}
            </p>
            <p>
              <strong>Permission:</strong> {snapshot.permission ?? 'n/a'}
            </p>
          </section>

          <section className="push-debug-checks" aria-label="Status checks">
            <h2>Status</h2>
            <ul className="push-debug-checklist">
              {snapshot.checks.map((check) => (
                <li
                  key={check.id}
                  className={`push-debug-check push-debug-check--${check.status}`}
                >
                  <span className="push-debug-check-icon" aria-hidden>
                    {checkIcon(check.status)}
                  </span>
                  <div className="push-debug-check-body">
                    <strong>{check.label}</strong>
                    <span>{check.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="push-debug-tokens" aria-label="Tokens">
            <h2>Tokens</h2>
            <TokenField
              id="push-debug-jwt"
              label="Mobile session JWT"
              value={snapshot.sessionToken}
              emptyHint="Sign in via OTP"
            />
            <TokenField
              id="push-debug-token"
              label={
                snapshot.platform === 'ios'
                  ? 'APNs push token (registered on server)'
                  : 'FCM registration token (registered on server)'
              }
              value={snapshot.pushToken}
              emptyHint={
                snapshot.pushError ??
                'Allow notifications on a physical device, then Refresh'
              }
            />
            {snapshot.platform === 'ios' ? (
              <>
                <TokenField
                  id="push-debug-apns-env"
                  label="APNs environment (client)"
                  value={snapshot.apnsEnvironment}
                  emptyHint="—"
                />
                <TokenField
                  id="push-debug-apns"
                  label="APNs device token (same as push token on iOS)"
                  value={snapshot.apnsToken}
                  emptyHint="May appear after Refresh on iOS"
                />
              </>
            ) : null}
          </section>

          <p className="push-debug-footnote">
            Stored push token in localStorage:{' '}
            {snapshot.storedPushToken
              ? `${snapshot.storedPushToken.slice(0, 12)}…`
              : 'none'}
            . Backend devices:{' '}
            {snapshot.serverPushStatus
              ? snapshot.serverPushStatus.deviceCount
              : 'log in to check'}
            .
          </p>
        </div>
      ) : loading ? (
        <p className="push-debug-loading">Loading…</p>
      ) : (
        <p className="push-debug-loading">Could not load debug data.</p>
      )}

      <MobileFooter />
    </div>
  );
}
