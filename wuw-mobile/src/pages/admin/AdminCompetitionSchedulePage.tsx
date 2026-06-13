import { useEffect, useMemo, useState } from 'react';

import { Card, PageHeader, StatPill } from '../../components/ui';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { cacheKeys } from '../../lib/dataCache';
import { resolveMediaUrl } from '../../lib/resolveMediaUrl';
import { mobileDataService } from '../../services/mobileDataService';
import type { AdminCompetitionScheduleRow } from '../../types';

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

type StatusFilter = 'ALL' | 'ACTIVE' | 'NOT_ACTIVE';

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toIsoString(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

function isValidDateTimeLocal(value: string): boolean {
  if (!value.includes('T')) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function formatStatusLabel(status: AdminCompetitionScheduleRow['status']): string {
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
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function ScheduleCompetitionThumb({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(imageUrl ?? '');

  if (!src || failed) {
    return <div className="draws-thumb draws-thumb--fallback" aria-hidden />;
  }

  return (
    <div className="draws-thumb">
      <img
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function AdminCompetitionSchedulePage() {
  const { data: profileResult, isLoading: profileLoading } = useCachedQuery(
    cacheKeys.mobileProfile,
    () => mobileDataService.loadMobileProfile(),
  );

  const [rows, setRows] = useState<AdminCompetitionScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');

  useEffect(() => {
    if (profileLoading || profileResult?.kind !== 'ok' || !profileResult.data.isAdmin) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const list = await mobileDataService.listAdminCompetitionSchedules();
        if (cancelled) return;
        const filteredList = list.filter((row) => row.status !== 'COMPLETED');
        setRows(filteredList);
        const nextEdits: Record<string, EditState> = {};
        filteredList.forEach((row) => {
          nextEdits[row.id] = {
            drawingDate: toDateTimeLocalValue(row.drawing_date),
            endDate: toDateTimeLocalValue(row.end_date),
          };
        });
        setEdits(nextEdits);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load competitions');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, profileResult]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(a.drawing_date).getTime() - new Date(b.drawing_date).getTime(),
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

  const saveRow = async (rowId: string) => {
    const currentEdit = edits[rowId];
    if (!currentEdit?.drawingDate || !currentEdit.endDate) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
          notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
          message: 'Both date and time are required',
          isError: true,
        },
      }));
      return;
    }
    if (!isValidDateTimeLocal(currentEdit.drawingDate) || !isValidDateTimeLocal(currentEdit.endDate)) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          notifyingCompetition: prev[rowId]?.notifyingCompetition ?? false,
          notifyingSchedule: prev[rowId]?.notifyingSchedule ?? false,
          message: 'Enter a valid date and time',
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
      const updated = await mobileDataService.updateAdminCompetitionSchedule(rowId, {
        drawingDate: toIsoString(currentEdit.drawingDate),
        endDate: toIsoString(currentEdit.endDate),
      });

      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                drawing_date: updated.drawing_date,
                end_date: updated.end_date,
                updatedAt: updated.updatedAt,
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
  };

  const notifyCompetitionRow = async (row: AdminCompetitionScheduleRow) => {
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
      const result = await mobileDataService.sendAdminCompetitionNotification(row.id);

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
  };

  const notifyScheduleRow = async (row: AdminCompetitionScheduleRow) => {
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
      const result = await mobileDataService.sendAdminCompetitionScheduleNotification(row.id);

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

      if (result.kind === 'already_sent') {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  scheduleAnnouncementSentAt: result.sentAt ?? item.scheduleAnnouncementSentAt,
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
            message: 'Schedule push already sent for this competition',
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
          message: result.errorMessage
            ? `Schedule push failed: ${result.errorMessage}`
            : result.legacyTokenCount && result.legacyTokenCount > 0
              ? `${result.legacyTokenCount} subscriber(s) still have legacy push tokens. They must reopen the mobile app and re-subscribe to draw alerts.`
              : 'Schedule push delivery failed, try again',
          isError: true,
        },
      }));
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
  };

  if (profileLoading || loading) {
    return (
      <section className="page-stack page-content-pad">
        <PageHeader eyebrow="Admin" title="Competition Schedule" />
        <Card>
          <p>Loading competitions...</p>
        </Card>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-stack page-content-pad">
        <PageHeader eyebrow="Admin" title="Competition Schedule" />
        <Card>
          <p>{loadError}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-stack page-content-pad">
      <PageHeader
        eyebrow="Admin"
        title="Competition Schedule"
        description="Edit end date and draw date for each competition."
      />
      <nav className="segmented-nav" role="tablist" aria-label="Filter competitions by status">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
          className={`segment admin-schedule-filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
        >
          {`All (${sortedRows.length})`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter('ACTIVE')}
          className={`segment admin-schedule-filter-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
        >
          {`Active (${activeCount})`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'NOT_ACTIVE'}
          onClick={() => setStatusFilter('NOT_ACTIVE')}
          className={`segment admin-schedule-filter-tab ${statusFilter === 'NOT_ACTIVE' ? 'active' : ''}`}
        >
          {`Not active (${notActiveCount})`}
        </button>
      </nav>
      {sortedRows.length === 0 ? (
        <Card>
          <p>No competitions to edit yet.</p>
        </Card>
      ) : null}
      {sortedRows.length > 0 && visibleRows.length === 0 ? (
        <Card>
          <p>No competitions with this status.</p>
        </Card>
      ) : null}
      {visibleRows.map((row) => {
        const state = saveState[row.id];
        const rowEdit = edits[row.id];
        const originalEndDate = toDateTimeLocalValue(row.end_date);
        const originalDrawingDate = toDateTimeLocalValue(row.drawing_date);
        const hasScheduleChanges = Boolean(
          rowEdit
          && (
            rowEdit.endDate !== originalEndDate
            || rowEdit.drawingDate !== originalDrawingDate
          ),
        );
        const canNotifyCompetition = row.status === 'ACTIVE' && !row.announcementSentAt;
        const canNotifySchedule = !row.scheduleAnnouncementSentAt;

        return (
          <Card key={row.id}>
            <div className="admin-schedule-card-header">
              <ScheduleCompetitionThumb imageUrl={row.imageUrl} name={row.name} />
              <div className="admin-schedule-card-copy">
                <h3>{row.name}</h3>
                <div className="stats-grid">
                  <StatPill label="Status" value={formatStatusLabel(row.status)} />
                  <StatPill label="Updated" value={formatDateTime24h(row.updatedAt)} />
                </div>
              </div>
            </div>

            <div className="admin-schedule-field">
              <label className="field-label" htmlFor={`${row.id}-end-datetime`}>
                End date & time
              </label>
              <input
                id={`${row.id}-end-datetime`}
                className="text-field text-field--picker"
                type="datetime-local"
                step="60"
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
            </div>

            <div className="admin-schedule-field">
              <label className="field-label" htmlFor={`${row.id}-draw-datetime`}>
                Draw date & time
              </label>
              <input
                id={`${row.id}-draw-datetime`}
                className="text-field text-field--picker"
                type="datetime-local"
                step="60"
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
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="checkout-flow-button checkout-flow-button--light"
                disabled={
                  (state?.saving ?? false)
                  || (state?.notifyingCompetition ?? false)
                  || (state?.notifyingSchedule ?? false)
                  || !canNotifyCompetition
                }
                onClick={() => void notifyCompetitionRow(row)}
              >
                {state?.notifyingCompetition
                  ? 'Sending push...'
                  : row.announcementSentAt
                    ? 'Push already sent'
                    : 'Send push notification'}
              </button>
              <button
                type="button"
                className="checkout-flow-button checkout-flow-button--light"
                disabled={
                  (state?.saving ?? false)
                  || (state?.notifyingCompetition ?? false)
                  || (state?.notifyingSchedule ?? false)
                  || !canNotifySchedule
                }
                onClick={() => void notifyScheduleRow(row)}
              >
                {state?.notifyingSchedule
                  ? 'Sending schedule push...'
                  : row.scheduleAnnouncementSentAt
                    ? 'Schedule push already sent'
                    : 'Send schedule update push'}
              </button>
              <button
                type="button"
                className="checkout-flow-button"
                disabled={
                  (state?.saving ?? false)
                  || (state?.notifyingCompetition ?? false)
                  || (state?.notifyingSchedule ?? false)
                  || !hasScheduleChanges
                }
                onClick={() => void saveRow(row.id)}
              >
                {state?.saving ? 'Saving...' : 'Save schedule'}
              </button>
            </div>

            {state?.message ? (
              <p style={{ margin: 0, color: state.isError ? '#b91c1c' : '#114f33', fontWeight: 700 }}>
                {state.message}
              </p>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}
