import { describe, expect, it } from 'vitest';

import { buildDrawReminderRecipientWhere } from './recipients';

describe('buildDrawReminderRecipientWhere', () => {
  const competitionId = 'comp-1';

  it('requires push device and draw alert subscription by default', () => {
    const where = buildDrawReminderRecipientWhere({ competitionId });
    expect(where).toEqual({
      pushDevices: { some: {} },
      drawRemindersSent: { none: { competitionId } },
      drawAlertSubscriptions: { some: { competitionId } },
    });
  });

  it('skips draw-alert check when bypassEligibility is true', () => {
    const where = buildDrawReminderRecipientWhere({
      competitionId,
      bypassEligibility: true,
    });
    expect(where.drawAlertSubscriptions).toBeUndefined();
    expect(where.pushDevices).toEqual({ some: {} });
  });

  it('scopes to userId when provided', () => {
    const where = buildDrawReminderRecipientWhere({
      competitionId,
      userId: 'user-abc',
    });
    expect(where.id).toBe('user-abc');
  });

  it('omits drawRemindersSent filter when skipAlreadySent is true', () => {
    const where = buildDrawReminderRecipientWhere({
      competitionId,
      skipAlreadySent: true,
    });
    expect(where.drawRemindersSent).toBeUndefined();
  });

  it('does not include ticket email eligibility', () => {
    const where = buildDrawReminderRecipientWhere({ competitionId });
    expect(where).not.toHaveProperty('OR');
    expect(where).not.toHaveProperty('email');
  });
});
