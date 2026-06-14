import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function installLocalStorageMock(): void {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  });
}

const {
  cancelDrawReminderMock,
  ensureLocalNotificationPermissionMock,
  scheduleDrawReminderMock,
  getMobileSessionTokenMock,
  listReminderTargetCompetitionsMock,
  subscribeDrawAlertMock,
} = vi.hoisted(() => ({
  cancelDrawReminderMock: vi.fn(),
  ensureLocalNotificationPermissionMock: vi.fn(),
  scheduleDrawReminderMock: vi.fn(),
  getMobileSessionTokenMock: vi.fn(),
  listReminderTargetCompetitionsMock: vi.fn(),
  subscribeDrawAlertMock: vi.fn(),
}));

vi.mock('./drawLocalNotifications', () => ({
  DRAW_REMINDER_LEAD_MINUTES: 10,
  drawReminderFireAtMs: (drawingDateIso: string, nowMs: number = Date.now()) => {
    const drawMs = new Date(drawingDateIso).getTime();
    if (!Number.isFinite(drawMs) || drawMs <= nowMs) {
      return null;
    }
    const ideal = drawMs - 10 * 60_000;
    return ideal <= nowMs ? nowMs + 30_000 : ideal;
  },
  ensureLocalNotificationPermission: ensureLocalNotificationPermissionMock,
  cancelDrawReminder: cancelDrawReminderMock,
  scheduleDrawReminder: scheduleDrawReminderMock,
  drawReminderFailureMessage: (result: { message: string }) => result.message,
}));

vi.mock('./mobileSessionToken', () => ({
  getMobileSessionToken: getMobileSessionTokenMock,
}));

vi.mock('../services/mobileDataService', () => ({
  mobileDataService: {
    listReminderTargetCompetitions: listReminderTargetCompetitionsMock,
    subscribeDrawAlert: subscribeDrawAlertMock,
  },
}));

import { reconcileDrawReminders } from './drawReminderSubscribe';
import {
  listDrawRemindersLocally,
  removeDrawReminderLocally,
  saveDrawReminderLocally,
} from './drawReminderLocalStorage';

const DRAWING_DATE = '2030-06-01T20:00:00.000Z';
const END_DATE = '2030-06-01T20:00:00.000Z';
const SCHEDULE_VERSION = `v1:${DRAWING_DATE}|${END_DATE}`;
const UPDATED_DRAWING_DATE = '2030-06-02T20:00:00.000Z';
const UPDATED_END_DATE = '2030-06-02T20:00:00.000Z';
const UPDATED_SCHEDULE_VERSION = `v1:${UPDATED_DRAWING_DATE}|${UPDATED_END_DATE}`;

function expectedFireAtMs(drawingDateIso: string): number {
  const drawMs = Date.parse(drawingDateIso);
  return drawMs - 10 * 60_000;
}

describe('reconcileDrawReminders', () => {
  beforeEach(() => {
    installLocalStorageMock();
    vi.clearAllMocks();
    getMobileSessionTokenMock.mockReturnValue('session-token');
    ensureLocalNotificationPermissionMock.mockResolvedValue(true);
    scheduleDrawReminderMock.mockImplementation(async (input: { drawingDateIso: string }) => ({
      ok: true as const,
      fireAtMs: expectedFireAtMs(input.drawingDateIso),
    }));
    subscribeDrawAlertMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns early when the user is not logged in', async () => {
    getMobileSessionTokenMock.mockReturnValue(null);

    const result = await reconcileDrawReminders();

    expect(result.considered).toBe(0);
    expect(listReminderTargetCompetitionsMock).not.toHaveBeenCalled();
  });

  it('leaves reminders unchanged when local schedule matches the server', async () => {
    const fireAtMs = expectedFireAtMs(DRAWING_DATE);
    saveDrawReminderLocally('cmp-1', {
      competitionName: 'Test draw',
      fireAtMs,
      drawScheduleVersion: SCHEDULE_VERSION,
    });
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-1',
        name: 'Test draw',
        drawingDate: DRAWING_DATE,
        endDate: END_DATE,
        drawScheduleVersion: SCHEDULE_VERSION,
      },
    ]);

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      unchanged: 1,
      updated: 0,
      created: 0,
    });
    expect(scheduleDrawReminderMock).not.toHaveBeenCalled();
    expect(subscribeDrawAlertMock).not.toHaveBeenCalled();
  });

  it('reschedules when the draw date changed on the server', async () => {
    const oldFireAtMs = expectedFireAtMs(DRAWING_DATE);
    saveDrawReminderLocally('cmp-1', {
      competitionName: 'Test draw',
      fireAtMs: oldFireAtMs,
      drawScheduleVersion: SCHEDULE_VERSION,
    });
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-1',
        name: 'Test draw',
        drawingDate: UPDATED_DRAWING_DATE,
        endDate: UPDATED_END_DATE,
        drawScheduleVersion: UPDATED_SCHEDULE_VERSION,
      },
    ]);

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      updated: 1,
      unchanged: 0,
      created: 0,
      updatedCompetitionNames: ['Test draw'],
    });
    expect(scheduleDrawReminderMock).toHaveBeenCalledWith({
      competitionId: 'cmp-1',
      competitionName: 'Test draw',
      drawingDateIso: UPDATED_DRAWING_DATE,
    });
    expect(subscribeDrawAlertMock).toHaveBeenCalledWith('cmp-1');

    const stored = listDrawRemindersLocally();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      competitionId: 'cmp-1',
      fireAtMs: expectedFireAtMs(UPDATED_DRAWING_DATE),
      drawScheduleVersion: UPDATED_SCHEDULE_VERSION,
    });
  });

  it('creates a reminder for a ticket holder without a local entry yet', async () => {
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-ticket',
        name: 'Ticket draw',
        drawingDate: DRAWING_DATE,
        endDate: END_DATE,
        drawScheduleVersion: SCHEDULE_VERSION,
      },
    ]);

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      created: 1,
      updated: 0,
      unchanged: 0,
    });
    expect(scheduleDrawReminderMock).toHaveBeenCalledOnce();
    expect(subscribeDrawAlertMock).toHaveBeenCalledWith('cmp-ticket');
    expect(listDrawRemindersLocally()[0]?.competitionId).toBe('cmp-ticket');
  });

  it('cancels stale local reminders when the draw has already passed', async () => {
    saveDrawReminderLocally('cmp-past', {
      competitionName: 'Past draw',
      fireAtMs: Date.now() + 60_000,
      drawScheduleVersion: SCHEDULE_VERSION,
    });
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-past',
        name: 'Past draw',
        drawingDate: '2020-01-01T12:00:00.000Z',
        endDate: '2020-01-01T12:00:00.000Z',
        drawScheduleVersion: 'v1:2020-01-01T12:00:00.000Z|2020-01-01T12:00:00.000Z',
      },
    ]);

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      cancelled: 1,
      updated: 0,
      created: 0,
    });
    expect(cancelDrawReminderMock).toHaveBeenCalledWith('cmp-past');
    expect(scheduleDrawReminderMock).not.toHaveBeenCalled();
    expect(listDrawRemindersLocally()).toHaveLength(0);
  });

  it('reports permission denied without scheduling reminders', async () => {
    ensureLocalNotificationPermissionMock.mockResolvedValue(false);
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-1',
        name: 'Test draw',
        drawingDate: DRAWING_DATE,
        endDate: END_DATE,
        drawScheduleVersion: SCHEDULE_VERSION,
      },
    ]);

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      failed: 1,
      permissionDenied: true,
    });
    expect(scheduleDrawReminderMock).not.toHaveBeenCalled();
  });

  it('keeps existing local state when rescheduling fails', async () => {
    const fireAtMs = expectedFireAtMs(DRAWING_DATE);
    saveDrawReminderLocally('cmp-1', {
      competitionName: 'Test draw',
      fireAtMs,
      drawScheduleVersion: SCHEDULE_VERSION,
    });
    listReminderTargetCompetitionsMock.mockResolvedValue([
      {
        id: 'cmp-1',
        name: 'Test draw',
        drawingDate: UPDATED_DRAWING_DATE,
        endDate: UPDATED_END_DATE,
        drawScheduleVersion: UPDATED_SCHEDULE_VERSION,
      },
    ]);
    scheduleDrawReminderMock.mockResolvedValue({
      ok: false,
      reason: 'schedule_failed',
      message: 'Could not schedule',
    });

    const result = await reconcileDrawReminders();

    expect(result).toMatchObject({
      considered: 1,
      failed: 1,
      updated: 0,
    });
    expect(listDrawRemindersLocally()[0]).toMatchObject({
      competitionId: 'cmp-1',
      fireAtMs,
      drawScheduleVersion: SCHEDULE_VERSION,
    });
    removeDrawReminderLocally('cmp-1');
  });
});
