import { describe, expect, it } from 'vitest';

import {
  competitionDetailPath,
  extractCompetitionIdFromNotificationPayload,
  extractNotificationTypeFromPayload,
  wasOpenedFromCompetitionNewNotification,
} from './notificationNavigation';

describe('notificationNavigation', () => {
  it('reads competitionId from a flat payload', () => {
    expect(extractCompetitionIdFromNotificationPayload({ competitionId: 'cmp-1' })).toBe('cmp-1');
  });

  it('reads competitionId from nested push data', () => {
    expect(
      extractCompetitionIdFromNotificationPayload({
        data: { competitionId: 'cmp-2', type: 'draw_reminder' },
      }),
    ).toBe('cmp-2');
  });

  it('reads competitionId from local notification extra', () => {
    expect(
      extractCompetitionIdFromNotificationPayload({
        extra: { competitionId: 'cmp-3', type: 'draw_reminder' },
      }),
    ).toBe('cmp-3');
  });

  it('reads competitionId from OneSignal additionalData', () => {
    expect(
      extractCompetitionIdFromNotificationPayload({
        additionalData: { competitionId: 'cmp-4', type: 'draw_schedule_updated' },
      }),
    ).toBe('cmp-4');
  });

  it('builds a locale-prefixed competition detail path', () => {
    expect(competitionDetailPath('cmp-5', 'fr')).toBe('/fr/competitions/cmp-5');
  });

  it('reads notification type from nested push data', () => {
    expect(
      extractNotificationTypeFromPayload({
        data: { competitionId: 'cmp-2', type: 'competition_new' },
      }),
    ).toBe('competition_new');
  });

  it('detects competition_new open intent', () => {
    sessionStorage.setItem('wuw_pending_notification_type', 'competition_new');
    expect(wasOpenedFromCompetitionNewNotification()).toBe(true);
    sessionStorage.removeItem('wuw_pending_notification_type');
  });
});
