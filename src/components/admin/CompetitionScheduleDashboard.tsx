'use client';

import { useEffect, useMemo, useState } from 'react';

import css from './CompetitionScheduleDashboard.module.css';
import { Button, Card, PageHeader, StatPill } from '@wuw/mobile-ui';

type CompetitionScheduleRow = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'NOT_ACTIVE' | 'COMPLETED';
  drawing_date: string;
  end_date: string;
  updatedAt: string;
};

type StatusFilter = 'ALL' | CompetitionScheduleRow['status'];

type EditState = {
  drawingDate: string;
  endDate: string;
};

type SaveState = {
  saving: boolean;
  message: string;
  isError: boolean;
};

function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
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

export function CompetitionScheduleDashboard() {
  const [rows, setRows] = useState<CompetitionScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  async function loadCompetitions() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/v1/competitions', {
        cache: 'no-store',
      });
      const payload = (await response.json()) as {
        data?: CompetitionScheduleRow[];
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Failed to load competitions');
      }

      setRows(payload.data);
      const nextEdits: Record<string, EditState> = {};
      payload.data.forEach((row) => {
        nextEdits[row.id] = {
          drawingDate: toDateTimeLocalValue(row.drawing_date),
          endDate: toDateTimeLocalValue(row.end_date),
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
          message: 'Both dates are required',
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
      const response = await fetch(`/api/admin/v1/competitions/${rowId}/schedule`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          drawingDate: toIsoString(currentEdit.drawingDate),
          endDate: toIsoString(currentEdit.endDate),
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
          const originalEndDate = toDateTimeLocalValue(row.end_date);
          const originalDrawingDate = toDateTimeLocalValue(row.drawing_date);
          const hasScheduleChanges = Boolean(
            rowEdit
            && (
              rowEdit.endDate !== originalEndDate
              || rowEdit.drawingDate !== originalDrawingDate
            ),
          );
          return (
            <Card key={row.id}>
              <h3 className={css.cardTitle}>{row.name}</h3>
              <div className={css.metaGrid}>
                <StatPill label="Status" value={formatStatusLabel(row.status)} />
                <StatPill
                  label="Updated"
                  value={formatDateTime24h(row.updatedAt)}
                />
              </div>
              <div className={css.fieldGrid}>
                <label className={css.field}>
                  <span>End date</span>
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
                  <span>Draw date</span>
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
                <Button
                  type="button"
                  className={css.saveButton}
                  variant="primary"
                  onClick={() => void saveRow(row.id)}
                  disabled={state?.saving || !hasScheduleChanges}
                >
                  {state?.saving ? 'Saving...' : 'Save schedule'}
                </Button>
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
    </div>
  );
}
