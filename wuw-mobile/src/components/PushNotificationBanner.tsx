import { usePushPermissionReminder } from '../hooks/usePushPermissionReminder';

export function PushNotificationBanner() {
  const { visible, busy, needsSettings, enable } = usePushPermissionReminder();

  if (!visible) {
    return null;
  }

  const actionLabel = busy
    ? 'Please wait…'
    : needsSettings
      ? 'Open settings'
      : 'Allow';

  return (
    <div className="push-notification-banner" role="status">
      <p className="push-notification-banner-text">
        Turn on notifications so you don&apos;t miss live draw reminders.
      </p>
      <button
        type="button"
        className="push-notification-banner-btn"
        disabled={busy}
        onClick={() => void enable()}
      >
        {actionLabel}
      </button>
    </div>
  );
}
