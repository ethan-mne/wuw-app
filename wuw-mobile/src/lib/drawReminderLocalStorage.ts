const STORAGE_KEY = 'wuw_draw_reminder_local_v1';

export type StoredDrawReminder = {
  competitionName: string;
  fireAtMs: number;
  drawScheduleVersion?: string;
};

function readAll(): Record<string, StoredDrawReminder> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, StoredDrawReminder>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredDrawReminder>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listDrawRemindersLocally(): Array<
  { competitionId: string } & StoredDrawReminder
> {
  const all = readAll();
  return Object.entries(all).map(([competitionId, value]) => ({
    competitionId,
    ...value,
  }));
}

export function isDrawReminderSubscribedLocally(competitionId: string): boolean {
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return false;
  }
  return Boolean(readAll()[trimmed]);
}

export function saveDrawReminderLocally(
  competitionId: string,
  input: { competitionName: string; fireAtMs: number; drawScheduleVersion: string },
): void {
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return;
  }
  const all = readAll();
  all[trimmed] = {
    competitionName: input.competitionName,
    fireAtMs: input.fireAtMs,
    drawScheduleVersion: input.drawScheduleVersion,
  };
  writeAll(all);
}

export function removeDrawReminderLocally(competitionId: string): void {
  const trimmed = competitionId.trim();
  if (!trimmed) {
    return;
  }
  const all = readAll();
  if (!(trimmed in all)) {
    return;
  }
  delete all[trimmed];
  writeAll(all);
}
