import { useEffect, useMemo, useState } from 'react';

import { Card, PageHeader, StatPill } from '../../components/ui';
import {
  AccountDataError,
  AccountSignInRequired,
} from '../../features/account/AccountFetchFallback';
import { useCachedQuery } from '../../hooks/useCachedQuery';
import { cacheKeys } from '../../lib/dataCache';
import { mobileDataService } from '../../services/mobileDataService';
import type { AdminCompetitionScheduleRow } from '../../types';

type EditState = {
  drawingDate: string;
  drawingTime: string;
  endDate: string;
  endTime: string;
};

type SaveState = {
  saving: boolean;
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

function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date = '', time = ''] = value.split('T');
  return { date, time };
}

function toEuropeanDate(localDate: string): string {
  const [year, month, day] = localDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year}`;
}

function europeanDateToLocal(value: string): string | null {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const dayNum = Number(day);
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || yearNum < 1900) {
    return null;
  }
  const parsed = new Date(yearNum, monthNum - 1, dayNum);
  if (
    parsed.getFullYear() !== yearNum
    || parsed.getMonth() !== monthNum - 1
    || parsed.getDate() !== dayNum
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

function joinLocalDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

function isValid24hTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const isSignedIn = profileResult?.kind === 'ok';
  const isAdmin = isSignedIn ? profileResult.data.isAdmin : false;

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
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
          const drawing = splitLocalDateTime(toDateTimeLocalValue(row.drawing_date));
          const end = splitLocalDateTime(toDateTimeLocalValue(row.end_date));
          nextEdits[row.id] = {
            drawingDate: toEuropeanDate(drawing.date),
            drawingTime: drawing.time,
            endDate: toEuropeanDate(end.date),
            endTime: end.time,
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
  }, [isAdmin]);

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
    if (!currentEdit?.drawingDate || !currentEdit?.drawingTime || !currentEdit.endDate || !currentEdit?.endTime) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          message: 'Both date and time are required',
          isError: true,
        },
      }));
      return;
    }
    if (!isValid24hTime(currentEdit.drawingTime) || !isValid24hTime(currentEdit.endTime)) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          message: 'Time must use 24h format (HH:mm)',
          isError: true,
        },
      }));
      return;
    }
    const drawingLocalDate = europeanDateToLocal(currentEdit.drawingDate);
    const endLocalDate = europeanDateToLocal(currentEdit.endDate);
    if (!drawingLocalDate || !endLocalDate) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          message: 'Date must use European format (DD.MM.YYYY)',
          isError: true,
        },
      }));
      return;
    }

    setSaveState((prev) => ({
      ...prev,
      [rowId]: { saving: true, message: '', isError: false },
    }));

    try {
      const updated = await mobileDataService.updateAdminCompetitionSchedule(rowId, {
        drawingDate: toIsoString(joinLocalDateTime(drawingLocalDate, currentEdit.drawingTime)),
        endDate: toIsoString(joinLocalDateTime(endLocalDate, currentEdit.endTime)),
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
        [rowId]: { saving: false, message: 'Saved', isError: false },
      }));
    } catch (error) {
      setSaveState((prev) => ({
        ...prev,
        [rowId]: {
          saving: false,
          message: error instanceof Error ? error.message : 'Update failed',
          isError: true,
        },
      }));
    }
  };

  if (profileLoading) {
    return (
      <div className="home-competitions-loading page-content-pad" role="status" aria-live="polite">
        <span className="home-competitions-loading-spinner" aria-hidden />
        <span className="sr-only">Loading admin dashboard...</span>
      </div>
    );
  }

  if (profileResult?.kind === 'sign_in_required') {
    return <AccountSignInRequired pageTitle="Admin dashboard" />;
  }

  if (profileResult?.kind === 'error') {
    return <AccountDataError pageTitle="Admin dashboard" onRetry={() => window.location.reload()} />;
  }

  if (!isSignedIn || !isAdmin) {
    return (
      <section className="page-stack page-content-pad">
        <PageHeader eyebrow="Admin" title="Dashboard" description="Admin access required." />
        <Card>
          <p>You do not have access to this page.</p>
        </Card>
      </section>
    );
  }

  if (loading) {
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
        const originalEnd = splitLocalDateTime(toDateTimeLocalValue(row.end_date));
        const originalDrawing = splitLocalDateTime(toDateTimeLocalValue(row.drawing_date));
        const originalEndDateEu = toEuropeanDate(originalEnd.date);
        const originalDrawingDateEu = toEuropeanDate(originalDrawing.date);
        const hasScheduleChanges = Boolean(
          rowEdit
          && (
            rowEdit.endDate !== originalEndDateEu
            || rowEdit.endTime !== originalEnd.time
            || rowEdit.drawingDate !== originalDrawingDateEu
            || rowEdit.drawingTime !== originalDrawing.time
          ),
        );

        return (
          <Card key={row.id}>
            <h3>{row.name}</h3>
            <div className="stats-grid">
              <StatPill label="Status" value={formatStatusLabel(row.status)} />
              <StatPill label="Updated" value={formatDateTime24h(row.updatedAt)} />
            </div>

            <label className="field-label" htmlFor={`${row.id}-end-date`}>
              End date
            </label>
            <div className="admin-schedule-date-time-grid">
              <input
                id={`${row.id}-end-date`}
                className="text-field"
                type="text"
                inputMode="numeric"
                placeholder="DD.MM.YYYY"
                pattern="\d{2}\.\d{2}\.\d{4}"
                maxLength={10}
                value={rowEdit?.endDate ?? ''}
                onChange={(event) =>
                  setEdits((prev) => ({
                    ...prev,
                    [row.id]: {
                      ...(prev[row.id] ?? { drawingDate: '', drawingTime: '', endDate: '', endTime: '' }),
                      endDate: event.target.value,
                    },
                  }))
                }
              />
              <input
                id={`${row.id}-end-time`}
                className="text-field"
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                maxLength={5}
                value={rowEdit?.endTime ?? ''}
                onChange={(event) =>
                  setEdits((prev) => ({
                    ...prev,
                    [row.id]: {
                      ...(prev[row.id] ?? { drawingDate: '', drawingTime: '', endDate: '', endTime: '' }),
                      endTime: event.target.value,
                    },
                  }))
                }
              />
            </div>

            <label className="field-label" htmlFor={`${row.id}-draw-date`}>
              Draw date
            </label>
            <div className="admin-schedule-date-time-grid">
              <input
                id={`${row.id}-draw-date`}
                className="text-field"
                type="text"
                inputMode="numeric"
                placeholder="DD.MM.YYYY"
                pattern="\d{2}\.\d{2}\.\d{4}"
                maxLength={10}
                value={rowEdit?.drawingDate ?? ''}
                onChange={(event) =>
                  setEdits((prev) => ({
                    ...prev,
                    [row.id]: {
                      ...(prev[row.id] ?? { drawingDate: '', drawingTime: '', endDate: '', endTime: '' }),
                      drawingDate: event.target.value,
                    },
                  }))
                }
              />
              <input
                id={`${row.id}-draw-time`}
                className="text-field"
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                maxLength={5}
                value={rowEdit?.drawingTime ?? ''}
                onChange={(event) =>
                  setEdits((prev) => ({
                    ...prev,
                    [row.id]: {
                      ...(prev[row.id] ?? { drawingDate: '', drawingTime: '', endDate: '', endTime: '' }),
                      drawingTime: event.target.value,
                    },
                  }))
                }
              />
            </div>

            <button
              type="button"
              className="checkout-flow-button"
              disabled={state?.saving || !hasScheduleChanges}
              onClick={() => void saveRow(row.id)}
            >
              {state?.saving ? 'Saving...' : 'Save schedule'}
            </button>

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
