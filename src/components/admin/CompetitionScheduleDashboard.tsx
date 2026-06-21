'use client';

import { useEffect, useMemo, useState } from 'react';

import css from './CompetitionScheduleDashboard.module.css';
import { competitionThumbUrl } from '@/lib/competitionThumbUrl';
import {
  fromAdminScheduleDateTimeLocalToIso,
  toAdminScheduleDateTimeLocalValue,
} from '@/lib/competitionScheduleDateTime';
import { Button, Card, PageHeader, StatPill } from '@wuw/mobile-ui';

type MobileCompetitionImageSource = {
  id: string;
  name: string;
  competitionImageUrl?: string | null;
  watch?: {
    images?: Array<{ url?: string | null; alt?: string }>;
  };
};

type CompetitionScheduleRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  drawing_date: string;
  end_date: string;
  updatedAt: string;
  competitionImageUrl?: string | null;
  watch?: {
    images?: Array<{ url?: string | null; alt?: string }>;
  };
  announcementSentAt: string | null;
  scheduleAnnouncementSentAt: string | null;
};

type StatusFilter = 'ALL' | CompetitionScheduleRow['status'];

type EditState = {
  drawingDate: string;
  endDate: string;
};

type SaveState = {
  saving: boolean;
  notifyingCompetition: boolean;
  notifyingSchedule: boolean;
  message: string;
  isError: boolean;
};

type NotificationResponseData = {
  kind:
    | 'sent'
    | 'already_sent'
    | 'not_active'
    | 'no_recipients'
    | 'delivery_failed';
  sentAt?: string;
  attempted?: number;
  successCount?: number;
  errorMessage?: string;
  legacyTokenCount?: number;
};

function formatSchedulePushDeliveryFailureMessage(result: NotificationResponseData): string {
  if (result.errorMessage) {
    return `Schedule push failed: ${result.errorMessage}`;
  }
  if (result.legacyTokenCount && result.legacyTokenCount > 0) {
    return `${result.legacyTokenCount} subscriber(s) still have legacy push tokens. They must reopen the mobile app and re-subscribe to draw alerts.`;
  }
  return 'Schedule push delivery failed, try again';
}

function formatStatusLabel(status: CompetitionScheduleRow['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'NOT_ACTIVE':
      return 'Not active';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
}

function formatDateTime24h(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function scheduleImageSrc(
  row: CompetitionScheduleRow,
  competition?: MobileCompetitionImageSource,
): string {
  return competitionThumbUrl(competition ?? row);
}

function SchedulePushConfirmModal({
  row,
  open,
  confirming,
  onCancel,
  onConfirm,
}: {
  row: CompetitionScheduleRow | null;
  open: boolean;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !row) {
    return null;
  }

  const previouslySent = Boolean(row.scheduleAnnouncementSentAt);

  return (
    <div
      className={css.modalBackdrop}
      role="presentation"
      onClick={confirming ? undefined : onCancel}
    >
      <div
        className={css.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-push-confirm-title"
        aria-describedby="schedule-push-confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="schedule-push-confirm-title" className={css.modalTitle}>
          {previouslySent ? 'Send schedule update push again?' : 'Send schedule update push?'}
        </h3>
        <p
          className={`${css.modalStatus} ${previouslySent ? css.modalStatusSent : css.modalStatusPending}`}
        >
          {previouslySent
            ? `Last sent: ${formatDateTime24h(row.scheduleAnnouncementSentAt!)}`
            : 'Not sent yet'}
        </p>
        <p id="schedule-push-confirm-message" className={css.modalMessage}>
          {previouslySent
            ? `This will send another push notification to draw-alert subscribers for "${row.name}".`
            : `This will notify draw-alert subscribers that the schedule for "${row.name}" has changed.`}
        </p>
        <div className={css.modalActions}>
          <Button type="button" variant="ghost" disabled={confirming} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Sending...' : previouslySent ? 'Send again' : 'Send push'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScheduleCompetitionPhoto({
  row,
  competition,
}: {
  row: CompetitionScheduleRow;
  competition?: MobileCompetitionImageSource;
}) {
  const [failed, setFailed] = useState(false);
  const src = scheduleImageSrc(row, competition);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <div className={`${css.photo} ${css.photoFallback}`} aria-hidden />;
  }

  return (
    <div className={css.photo}>
      <img
        src={src}
        alt={row.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

async function loadMobileCompetitionImageSource(
  id: string,
): Promise<MobileCompetitionImageSource | undefined> {
  const response = await fetch(`/api/mobile/v1/competitions/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    return undefined;
  }
  const payload = (await response.json()) as { data?: MobileCompetitionImageSource };
  return payload.data;
}

export function CompetitionScheduleDashboard() {
  const [rows, setRows] = useState<CompetitionScheduleRow[]>([]);
  const [competitionsById, setCompetitionsById] = useState<
    Record<string, MobileCompetitionImageSource>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [schedulePushConfirmRow, setSchedulePushConfirmRow] =
    useState<CompetitionScheduleRow | null>(null);

  async function loadCompetitions() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/v1/competitions', {
        cache: 'no-store',
        credentials: 'include',
      });
      const payload = (await response.json()) as {
        data?: CompetitionScheduleRow[];
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load competitions');
      }

      const competitionResults = await Promise.all(
        payload.data.map((row) => loadMobileCompetitionImageSource(row.id).catch(() => undefined)),
      );
      const nextCompetitionsById: Record<string, MobileCompetitionImageSource> = {};
      for (const competition of competitionResults) {
        if (competition?.id) {
          nextCompetitionsById[competition.id] = competition;
        }
      }

      setRows(payload.data);
      setCompetitionsById(nextCompetitionsById);
      const nextEdits: Record<string, EditState> = {};
      payload.data.forEach((row) => {
        nextEdits[row.id] = {
          drawingDate: toAdminScheduleDateTimeLocalValue(row.drawing_date),
          endDate: toAdminScheduleDateTimeLocalValue(row.end_date),
        };
      });
      setEdits(nextEdits);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load competitions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompetitions();
  }, []);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(a.drawing_date).getTime() - new Date(b.drawing_date).getTime(),
      ),
    [rows],
  );
  const visibleRows = useMemo(
    () =>
      statusFilter === 'ALL'
        ? sortedRows
        : sortedRows.filter((row) => row.status === statusFilter),
    [sortedRows, statusFilter],
  );
  const activeCount = useMemo(
    () => sortedRows.filter((row) => row.status === 'ACTIVE').length,
    [sortedRows],
  );
  const notActiveCount = useMemo(
    () => sortedRows.filter((row) => row.status === 'NOT_ACTIVE').length,
    [sortedRows],
  );

  async function saveRow(rowId: string) {
    const currentEdit = edits[rowId];
    if (!currentEdit?.drawingDate || !currentEdit.endDate) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
          notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
          message: 'Both dates are required',
          isError: true,
        },
      }));
      return;
    }

    setSaveState((prev) => ({
      ...prev,
      [rowId]: {
        saving: true,
        notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
        notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
        message: '',
        isError: false,
      },
    }));

    try {
      const response = await fetch(`/api/admin/v1/competitions/${rowId}/schedule`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          drawingDate: fromAdminScheduleDateTimeLocalToIso(currentEdit.drawingDate),
          endDate: fromAdminScheduleDateTimeLocalToIso(currentEdit.endDate),
        }),
      });

      const payload = (await response.json()) as {
        data?: CompetitionScheduleRow;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Update failed');
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                drawing_date: payload.data!.drawing_date,
                end_date: payload.data!.end_date,
                updatedAt: payload.data!.updatedAt,
              }
            : row,
        ),
      );
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
          notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
          message: 'Saved',
          isError: false,
        },
      }));
    } catch (error) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
          notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
          message: error instanceof Error ? error.message : 'Update failed',
          isError: true,
        },
      }));
    }
  }

  async function notifyCompetitionRow(row: CompetitionScheduleRow) {
    setSaveState((prev) => ({
      ...prev,
      [row.id]: {
        saving: prev[row.id]?.saving ?? false,
        notifyingCompetition: true,
        notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
        message: '',
        isError: false,
      },
    }));

    try {
      const response = await fetch(`/api/admin/v1/competitions/${row.id}/notify`, {
        method: 'POST',
        credentials: 'include',
      });

      const payload = (await response.json()) as {
        data?: NotificationResponseData;
        error?: string;
      };

      if (payload.data) {
        const result = payload.data;

        if (result.kind === 'sent') {
          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    announcementSentAt: result.sentAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          );
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: false,
              notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
              message: `Push sent (${result.successCount ?? 0}/${result.attempted ?? 0})`,
              isError: false,
            },
          }));
          return;
        }

        if (result.kind === 'already_sent') {
          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    announcementSentAt: result.sentAt ?? item.announcementSentAt,
                  }
                : item,
            ),
          );
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: false,
              notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
              message: 'Push already sent for this competition',
              isError: false,
            },
          }));
          return;
        }

        if (result.kind === 'no_recipients') {
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: false,
              notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
              message: 'No users with push notifications enabled',
              isError: true,
            },
          }));
          return;
        }

        if (result.kind === 'not_active') {
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: false,
              notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
              message: 'Competition must be active before sending push',
              isError: true,
            },
          }));
          return;
        }

        setSaveState((prev) => ({
          ...prev,
          [row.id]: {
            saving: prev[row.id]?.saving ?? false,
            notifyingCompetition: false,
            notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
            message: 'Push delivery failed, try again',
            isError: true,
          },
        }));
        return;
      }

      throw new Error(payload.error ?? 'Failed to send push notification');
    } catch (error) {
      setSaveState((prev) => ({
        ...prev,
        [row.id]: {
          saving: prev[row.id]?.saving ?? false,
          notifyingCompetition: false,
          notifyingSchedule: prev[row.id]?.notifyingSchedule ?? false,
          message: error instanceof Error ? error.message : 'Failed to send push notification',
          isError: true,
        },
      }));
    }
  }

  async function notifyScheduleRow(row: CompetitionScheduleRow) {
    setSaveState((prev) => ({
      ...prev,
      [row.id]: {
        saving: prev[row.id]?.saving ?? false,
        notifyingCompetition: prev[row.id]?.notifyingCompetition ?? false,
        notifyingSchedule: true,
        message: '',
        isError: false,
      },
    }));

    try {
      const response = await fetch(`/api/admin/v1/competitions/${row.id}/notify-schedule`, {
        method: 'POST',
        credentials: 'include',
      });

      const payload = (await response.json()) as {
        data?: NotificationResponseData;
        error?: string;
      };

      if (payload.data) {
        const result = payload.data;

        if (result.kind === 'sent') {
          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    scheduleAnnouncementSentAt: result.sentAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          );
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: prev[row.id]?.notifyingCompetition ?? false,
              notifyingSchedule: false,
              message: `Schedule push sent (${result.successCount ?? 0}/${result.attempted ?? 0})`,
              isError: false,
            },
          }));
          return;
        }

        if (result.kind === 'no_recipients') {
          setSaveState((prev) => ({
            ...prev,
            [row.id]: {
              saving: prev[row.id]?.saving ?? false,
              notifyingCompetition: prev[row.id]?.notifyingCompetition ?? false,
              notifyingSchedule: false,
              message: result.errorMessage ?? 'No draw-alert subscribers with push notifications',
              isError: true,
            },
          }));
          return;
        }

        setSaveState((prev) => ({
          ...prev,
          [row.id]: {
            saving: prev[row.id]?.saving ?? false,
            notifyingCompetition: prev[row.id]?.notifyingCompetition ?? false,
            notifyingSchedule: false,
            message: formatSchedulePushDeliveryFailureMessage(result),
            isError: true,
          },
        }));
        return;
      }

      throw new Error(payload.error ?? 'Failed to send schedule push notification');
    } catch (error) {
      setSaveState((prev) => ({
        ...prev,
        [row.id]: {
          saving: prev[row.id]?.saving ?? false,
          notifyingCompetition: prev[row.id]?.notifyingCompetition ?? false,
          notifyingSchedule: false,
          message: error instanceof Error ? error.message : 'Failed to send schedule push notification',
          isError: true,
        },
      }));
    }
  }

  if (loading) {
    return <p className={css.helper}>Loading competitions...</p>;
  }

  if (loadError) {
    return <p className={css.error}>{loadError}</p>;
  }

  return (
    <div className={css.container}>
      <PageHeader
        eyebrow="Admin"
        title="Competition Schedule"
      />
      <p className={css.helper}>Edit end date and draw date for each competition.</p>
      <div className={css.filterTabs} role="tablist" aria-label="Filter competitions by status">
        <Button
          type="button"
          variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
          className={css.filterTabButton}
          onClick={() => setStatusFilter('ALL')}
        >
          {`All (${sortedRows.length})`}
        </Button>
        <Button
          type="button"
          variant={statusFilter === 'ACTIVE' ? 'primary' : 'secondary'}
          className={css.filterTabButton}
          onClick={() => setStatusFilter('ACTIVE')}
        >
          {`Active (${activeCount})`}
        </Button>
        <Button
          type="button"
          variant={statusFilter === 'NOT_ACTIVE' ? 'primary' : 'secondary'}
          className={css.filterTabButton}
          onClick={() => setStatusFilter('NOT_ACTIVE')}
        >
          {`Not active (${notActiveCount})`}
        </Button>
      </div>
      {sortedRows.length === 0 ? (
        <Card>
          <p className={css.helper}>No competitions to edit yet.</p>
        </Card>
      ) : null}
      {sortedRows.length > 0 && visibleRows.length === 0 ? (
        <Card>
          <p className={css.helper}>No competitions with this status.</p>
        </Card>
      ) : null}
      <div className={css.cardList}>
        {visibleRows.map((row) => {
          const state = saveState[row.id];
          const rowEdit = edits[row.id];
          const originalEndDate = toAdminScheduleDateTimeLocalValue(row.end_date);
          const originalDrawingDate = toAdminScheduleDateTimeLocalValue(row.drawing_date);
          const hasScheduleChanges = Boolean(
            rowEdit
            && (
              rowEdit.endDate !== originalEndDate
              || rowEdit.drawingDate !== originalDrawingDate
            ),
          );
          const canNotifyCompetition = row.status === 'ACTIVE' && !row.announcementSentAt;
          return (
            <Card key={row.id}>
              <div className={css.cardIntro}>
                <ScheduleCompetitionPhoto row={row} competition={competitionsById[row.id]} />
                <h3 className={css.cardTitle}>{row.name}</h3>
                <div className={css.metaGrid}>
                  <StatPill label="Status" value={formatStatusLabel(row.status)} />
                  <StatPill
                    label="Updated"
                    value={formatDateTime24h(row.updatedAt)}
                  />
                </div>
              </div>
              <div className={css.fieldGrid}>
                <label className={css.field}>
                  <span>End date (Israel time)</span>
                  <input
                    className={css.input}
                    type="datetime-local"
                    lang="en-GB"
                    value={rowEdit?.endDate ?? ''}
                    onChange={(event) =>
                      setEdits((prev) => ({
                        ...prev,
                        [row.id]: {
                          ...(prev[row.id] ?? { drawingDate: '', endDate: '' }),
                          endDate: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className={css.field}>
                  <span>Draw date (Israel time)</span>
                  <input
                    className={css.input}
                    type="datetime-local"
                    lang="en-GB"
                    value={rowEdit?.drawingDate ?? ''}
                    onChange={(event) =>
                      setEdits((prev) => ({
                        ...prev,
                        [row.id]: {
                          ...(prev[row.id] ?? { drawingDate: '', endDate: '' }),
                          drawingDate: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>
              <div className={css.actionRow}>
                <div className={css.actionButtons}>
                  <Button
                    type="button"
                    className={css.notifyButton}
                    variant="secondary"
                    onClick={() => void notifyCompetitionRow(row)}
                    disabled={
                      (state?.notifyingCompetition ?? false)
                      || (state?.notifyingSchedule ?? false)
                      || (state?.saving ?? false)
                      || !canNotifyCompetition
                    }
                  >
                    {state?.notifyingCompetition
                      ? 'Sending push...'
                      : row.announcementSentAt
                        ? 'Push already sent'
                        : 'Send push notification'}
                  </Button>
                  <Button
                    type="button"
                    className={css.scheduleNotifyButton}
                    variant="secondary"
                    onClick={() => setSchedulePushConfirmRow(row)}
                    disabled={
                      (state?.notifyingCompetition ?? false)
                      || (state?.notifyingSchedule ?? false)
                      || (state?.saving ?? false)
                    }
                  >
                    {state?.notifyingSchedule
                      ? 'Sending schedule push...'
                      : 'Send schedule update push'}
                  </Button>
                  <Button
                    type="button"
                    className={css.saveButton}
                    variant="primary"
                    onClick={() => void saveRow(row.id)}
                    disabled={
                      (state?.saving ?? false)
                      || (state?.notifyingCompetition ?? false)
                      || (state?.notifyingSchedule ?? false)
                      || !hasScheduleChanges
                    }
                  >
                    {state?.saving ? 'Saving...' : 'Save schedule'}
                  </Button>
                </div>
                {state?.message ? (
                  <p
                    className={`${css.rowMessage} ${state.isError ? css.rowMessageError : css.rowMessageSuccess}`}
                  >
                    {state.message}
                  </p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
      <SchedulePushConfirmModal
        row={schedulePushConfirmRow}
        open={schedulePushConfirmRow !== null}
        confirming={
          schedulePushConfirmRow
            ? (saveState[schedulePushConfirmRow.id]?.notifyingSchedule ?? false)
            : false
        }
        onCancel={() => setSchedulePushConfirmRow(null)}
        onConfirm={() => {
          if (!schedulePushConfirmRow) {
            return;
          }
          void notifyScheduleRow(schedulePushConfirmRow).finally(() => {
            setSchedulePushConfirmRow(null);
          });
        }}
      />
    </div>
  );
}
