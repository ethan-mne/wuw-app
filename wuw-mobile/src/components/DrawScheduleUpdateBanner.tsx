import { useEffect, useRef, useState } from 'react';

type DrawScheduleUpdatedDetail = {
  updated: number;
  names?: string[];
};

const DRAW_SCHEDULE_UPDATED_EVENT = 'wuw-draw-schedule-updated';

function buildBannerMessage(detail: DrawScheduleUpdatedDetail): string {
  if (detail.updated <= 0) {
    return '';
  }
  if (detail.updated === 1 && detail.names?.[0]) {
    return `${detail.names[0]} draw time was updated while you were away.`;
  }
  return `${detail.updated} draw times were updated while you were away.`;
}

export function DrawScheduleUpdateBanner() {
  const [message, setMessage] = useState('');
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onScheduleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<DrawScheduleUpdatedDetail>).detail;
      const next = buildBannerMessage(detail ?? { updated: 0 });
      if (!next) {
        return;
      }
      setMessage(next);
      if (hideTimerRef.current != null) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setMessage('');
        hideTimerRef.current = null;
      }, 12_000);
    };

    window.addEventListener(DRAW_SCHEDULE_UPDATED_EVENT, onScheduleUpdated);
    return () => {
      window.removeEventListener(DRAW_SCHEDULE_UPDATED_EVENT, onScheduleUpdated);
      if (hideTimerRef.current != null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div className="draw-schedule-update-banner" role="status" aria-live="polite">
      <p className="draw-schedule-update-banner-text">{message}</p>
      <button
        type="button"
        className="draw-schedule-update-banner-btn"
        onClick={() => setMessage('')}
        aria-label="Dismiss draw schedule update notice"
      >
        Dismiss
      </button>
    </div>
  );
}
