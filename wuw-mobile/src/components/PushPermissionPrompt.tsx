import { useCallback, useEffect, useState } from 'react';

import { getMobileSessionToken } from '../lib/mobileSessionToken';
import {
  enablePushNotifications,
  getPushReceivePermission,
  isNativePushPlatform,
  notifyPushPermissionChanged,
  shouldShowPushPermissionPrompt,
} from '../lib/pushNotifications';
import {
  markPushPromptDismissedThisSession,
  wasPushPromptDismissedThisSession,
} from '../lib/pushPermissionPromptStorage';

type PushPermissionPromptProps = {
  /** Wait until the splash video is gone so the OS dialog is not hidden underneath. */
  ready: boolean;
};

export function PushPermissionPrompt({ ready }: PushPermissionPromptProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const evaluate = useCallback(async () => {
    if (!ready || !isNativePushPlatform() || !getMobileSessionToken()) {
      setOpen(false);
      return;
    }

    if (wasPushPromptDismissedThisSession()) {
      setOpen(false);
      return;
    }

    const receive = await getPushReceivePermission();
    setOpen(shouldShowPushPermissionPrompt(receive));
  }, [ready]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  useEffect(() => {
    const onSessionChange = () => {
      void evaluate();
    };
    window.addEventListener('storage', onSessionChange);
    window.addEventListener('wuw-mobile-session', onSessionChange);
    return () => {
      window.removeEventListener('storage', onSessionChange);
      window.removeEventListener('wuw-mobile-session', onSessionChange);
    };
  }, [evaluate]);

  const dismiss = () => {
    markPushPromptDismissedThisSession();
    setOpen(false);
  };

  const onEnable = async () => {
    setBusy(true);
    try {
      const ok = await enablePushNotifications();
      const receive = await getPushReceivePermission();
      if (ok || receive === 'granted') {
        setOpen(false);
        notifyPushPermissionChanged();
        return;
      }
      if (receive === 'denied') {
        markPushPromptDismissedThisSession();
        setOpen(false);
        notifyPushPermissionChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="push-permission-backdrop" role="presentation">
      <div
        className="push-permission-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-permission-title"
        aria-describedby="push-permission-desc"
      >
        <h2 id="push-permission-title" className="push-permission-title">
          Turn on notifications?
        </h2>
        <p id="push-permission-desc" className="push-permission-desc">
          Get a push about 10 minutes before live draws you follow or enter — and never miss the
          moment.
        </p>
        <div className="push-permission-actions">
          <button
            type="button"
            className="checkout-flow-button checkout-flow-button--light push-permission-primary"
            disabled={busy}
            onClick={() => void onEnable()}
          >
            {busy ? 'Enabling…' : 'Enable notifications'}
          </button>
          <button
            type="button"
            className="checkout-flow-button checkout-flow-button--ghost push-permission-secondary"
            disabled={busy}
            onClick={dismiss}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
