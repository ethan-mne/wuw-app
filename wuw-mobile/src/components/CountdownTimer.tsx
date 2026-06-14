import type { ReactNode } from 'react';

import {
  formatDrawDateTimeDual,
  getCountdownParts,
  getCountdownUnitLabels,
  type DrawDateTimeDual,
} from '../lib/drawTime';
import type { Locale } from '../types';

type CountdownTimerProps = {
  targetIso: string;
  locale: Locale;
  nowMs: number;
  scheduleIso?: string;
  note?: ReactNode;
  countdownClassName: string;
  noteClassName?: string;
};

export function DrawDateTimeDualDisplay({ dual }: { dual: DrawDateTimeDual }) {
  return (
    <p className="draw-datetime-dual">
      <span className="draw-datetime-dual-london">{dual.london}</span>
      {dual.local ? (
        <span className="draw-datetime-dual-local"> · {dual.local}</span>
      ) : null}
    </p>
  );
}

export function CountdownTimer({
  targetIso,
  locale,
  nowMs,
  scheduleIso,
  note,
  countdownClassName,
  noteClassName,
}: CountdownTimerProps) {
  const countdown = getCountdownParts(targetIso, nowMs);
  const labels = getCountdownUnitLabels(locale);
  const schedule = scheduleIso ? formatDrawDateTimeDual(scheduleIso, locale) : null;

  return (
    <>
      <div className={countdownClassName} role="timer" aria-live="off">
        <div>
          <strong>{countdown.day}</strong>
          <span>{labels.day}</span>
        </div>
        <div>
          <strong>{countdown.hour}</strong>
          <span>{labels.hour}</span>
        </div>
        <div>
          <strong>{countdown.min}</strong>
          <span>{labels.min}</span>
        </div>
        <div>
          <strong>{countdown.sec}</strong>
          <span>{labels.sec}</span>
        </div>
      </div>
      {schedule ? <DrawDateTimeDualDisplay dual={schedule} /> : null}
      {note
        ? noteClassName
          ? (
              <p className={noteClassName}>{note}</p>
            )
          : (
              note
            )
        : null}
    </>
  );
}
