import { apiClient } from './apiClient';
import { API_BASE_URL } from '../lib/config';
import { clearMobileSession, getMobileSessionToken, mobileAuthHeaders } from '../lib/mobileSessionToken';
import { Capacitor } from '@capacitor/core';
import {
  ensurePushRegisteredForAlerts,
  obtainPushToken,
  requestPushPermissionAndRegister,
  syncPushTokenIfPermitted,
} from '../lib/pushNotifications';
import type {
  AdminCompetitionScheduleRow,
  AccountSummary,
  CalendarFeedSubscription,
  Competition,
  HomeStats,
  MobileUserProfile,
  OrderSummary,
  RedeemFreeTicketResult,
  ReferralUsageItem,
  Winner,
  WatchImage,
} from '../types';

type ApiDataResponse<T> = {
  data: T;
};

function buildMobileApiRequestUrl(path: string): string {
  const isBrowser = typeof window !== 'undefined';
  const isNative = Capacitor.isNativePlatform();
  const isLocalhostBrowser = isBrowser && window.location.hostname === 'localhost';
  const currentOrigin = isBrowser ? window.location.origin : '';
  const shouldForceRelativeApi =
    !isNative
    && isBrowser
    && isLocalhostBrowser
    && path.startsWith('/api/')
    && API_BASE_URL
    && API_BASE_URL !== currentOrigin;

  if (shouldForceRelativeApi) {
    return path;
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export type ListWinnersResponse = {
  data: Winner[];
  hasMore: boolean;
};

class WinnersRequestError extends Error {
  readonly causes: string[];

  constructor(
    message: string,
    causes: string[] = [],
  ) {
    super(message);
    this.name = 'WinnersRequestError';
    this.causes = causes;
  }
}

type WinnerLike = Partial<Winner> & {
  watch?: string;
  watch_name?: string;
  img?: string | null;
  src?: string | null;
  date?: string;
};

function toWinner(item: WinnerLike, index: number): Winner {
  const id = item.id ?? `winner-${index}`;
  const prize = item.prize ?? item.watch ?? item.watch_name ?? 'Competition prize';
  const imageUrl = item.imageUrl ?? item.img ?? item.src ?? '';
  const drawDate = item.drawDate ?? item.date ?? '';

  return {
    id: String(id),
    name: item.name ?? 'Winner',
    prize,
    location: item.location ?? '',
    imageUrl,
    drawDate,
  };
}

function toWinnerArray(value: unknown): Winner[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value
    .filter((item): item is WinnerLike => typeof item === 'object' && item !== null)
    .map((item, index) => toWinner(item, index));
}

function normalizeWinnersResponse(payload: unknown): ListWinnersResponse {
  const directWinners = toWinnerArray(payload);
  if (directWinners) {
    return { data: directWinners, hasMore: false };
  }

  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as {
      data?: unknown;
      hasMore?: unknown;
      winners?: unknown;
    };

    const nestedData = toWinnerArray(candidate.data);
    if (nestedData) {
      return {
        data: nestedData,
        hasMore: typeof candidate.hasMore === 'boolean' ? candidate.hasMore : false,
      };
    }

    if (typeof candidate.data === 'object' && candidate.data !== null) {
      const nested = candidate.data as { data?: unknown; hasMore?: unknown };
      const twiceNestedData = toWinnerArray(nested.data);
      if (twiceNestedData) {
        return {
          data: twiceNestedData,
          hasMore: typeof nested.hasMore === 'boolean' ? nested.hasMore : false,
        };
      }
    }

    const winnersData = toWinnerArray(candidate.winners);
    if (winnersData) {
      return {
        data: winnersData,
        hasMore: typeof candidate.hasMore === 'boolean' ? candidate.hasMore : false,
      };
    }
  }

  return { data: [], hasMore: false };
}

function normalizeHomeStats(payload: unknown): HomeStats {
  const fallback: HomeStats = {
    instagramFollowers: '',
    amountWon: 0,
  };

  if (typeof payload !== 'object' || payload === null) {
    return fallback;
  }

  const root = payload as { data?: unknown; instagramFollowers?: unknown; amountWon?: unknown };
  const source =
    typeof root.data === 'object' && root.data !== null
      ? (root.data as Record<string, unknown>)
      : (root as Record<string, unknown>);

  const instagramFollowers =
    typeof source.instagramFollowers === 'string' ? source.instagramFollowers : '';
  const amountWonRaw = source.amountWon;
  const amountWon =
    typeof amountWonRaw === 'number'
      ? amountWonRaw
      : typeof amountWonRaw === 'string'
        ? Number.parseInt(amountWonRaw, 10) || 0
        : 0;

  return {
    instagramFollowers,
    amountWon,
  };
}

export type LoadAccountSummaryResult =
  | { kind: 'ok'; data: AccountSummary }
  | { kind: 'sign_in_required' }
  | { kind: 'error' };

async function loadAccountSummary(): Promise<LoadAccountSummaryResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(buildMobileApiRequestUrl('/api/mobile/v1/me/summary'), {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      await clearMobileSession();
      return { kind: 'sign_in_required' };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const json = (await response.json()) as ApiDataResponse<AccountSummary>;
    if (!json?.data || typeof json.data !== 'object') {
      return { kind: 'error' };
    }

    return { kind: 'ok', data: json.data };
  } catch {
    return { kind: 'error' };
  }
}

export type LoadMobileProfileResult =
  | { kind: 'ok'; data: MobileUserProfile }
  | { kind: 'sign_in_required' }
  | { kind: 'error' };

export type UpdateMobileProfilePayload = {
  firstname: string;
  lastname: string;
  country: string;
  zip: string;
  address: string;
  city: string;
  phone: string;
  email: string;
};

export type UpdateMobileProfileResult =
  | { kind: 'ok'; data: MobileUserProfile }
  | { kind: 'sign_in_required' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error' };

function optStr(v: unknown): string | null {
  if (v == null) {
    return null;
  }
  return typeof v === 'string' ? v : String(v);
}

function normalizeEmailVerified(v: unknown): string | null {
  if (v == null) {
    return null;
  }
  if (typeof v === 'string') {
    return v;
  }
  return String(v);
}

function normalizeMobileProfile(raw: unknown): MobileUserProfile | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.email !== 'string') {
    return null;
  }
  const isAdmin =
    typeof o.isAdmin === 'boolean'
      ? o.isAdmin
      : typeof o.is_admin === 'boolean'
        ? o.is_admin
        : false;
  return {
    firstName: optStr(o.firstName),
    lastName: optStr(o.lastName),
    email: o.email,
    phone: optStr(o.phone),
    country: optStr(o.country),
    zipCode: optStr(o.zipCode),
    address: optStr(o.address),
    city: optStr(o.city),
    image: optStr(o.image),
    emailVerified: normalizeEmailVerified(o.emailVerified),
    isAdmin,
  };
}

async function loadMobileProfile(): Promise<LoadMobileProfileResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(buildMobileApiRequestUrl('/api/mobile/v1/me'), {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      await clearMobileSession();
      return { kind: 'sign_in_required' };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const json = (await response.json()) as ApiDataResponse<unknown>;
    const parsed = normalizeMobileProfile(json.data);
    if (!parsed) {
      return { kind: 'error' };
    }

    return { kind: 'ok', data: parsed };
  } catch {
    return { kind: 'error' };
  }
}

async function updateMobileProfile(
  payload: UpdateMobileProfilePayload,
): Promise<UpdateMobileProfileResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(buildMobileApiRequestUrl('/api/mobile/v1/me'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      await clearMobileSession();
      return { kind: 'sign_in_required' };
    }

    if (response.status === 400) {
      let message = 'Could not save. Check your details.';
      try {
        const j = (await response.json()) as { error?: unknown };
        if (typeof j.error === 'string' && j.error.trim()) {
          message = j.error;
        }
      } catch {
        /* use default */
      }
      return { kind: 'invalid', message };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const json = (await response.json()) as ApiDataResponse<unknown>;
    const parsed = normalizeMobileProfile(json.data);
    if (!parsed) {
      return { kind: 'error' };
    }

    return { kind: 'ok', data: parsed };
  } catch {
    return { kind: 'error' };
  }
}

export type ListReferralUsagesResult =
  | { kind: 'ok'; data: ReferralUsageItem[] }
  | { kind: 'sign_in_required' }
  | { kind: 'error' };

async function listReferralUsages(): Promise<ListReferralUsagesResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(buildMobileApiRequestUrl('/api/mobile/v1/referrals/usage'), {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      await clearMobileSession();
      return { kind: 'sign_in_required' };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const json = (await response.json()) as ApiDataResponse<ReferralUsageItem[]>;
    if (!Array.isArray(json.data)) {
      return { kind: 'error' };
    }

    return { kind: 'ok', data: json.data };
  } catch {
    return { kind: 'error' };
  }
}

export type DrawsTimelineSeed = {
  past: Competition[];
  upcoming: Competition[];
  hasMorePast: boolean;
  hasMoreFuture: boolean;
};

export type DrawsTimelinePage = {
  items: Competition[];
  hasMore: boolean;
};

type UpdateAdminCompetitionSchedulePayload = {
  drawingDate: string;
  endDate: string;
};

function readNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeWatchImages(raw: unknown, fallbackName: string): WatchImage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const url = readNullableString(item.url);
      if (!url) {
        return null;
      }
      const alt = typeof item.alt === 'string' && item.alt.trim() ? item.alt : `${fallbackName} image`;
      return { url, alt };
    })
    .filter((item): item is WatchImage => item !== null);
}

function normalizeAdminCompetitionScheduleRow(raw: unknown): AdminCompetitionScheduleRow | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : null;
  const name = typeof row.name === 'string' ? row.name : null;
  const status = row.status;
  const drawingDate = typeof row.drawing_date === 'string' ? row.drawing_date : null;
  const endDate = typeof row.end_date === 'string' ? row.end_date : null;
  const updatedAt = typeof row.updatedAt === 'string' ? row.updatedAt : null;

  if (
    !id
    || !name
    || (status !== 'ACTIVE' && status !== 'NOT_ACTIVE' && status !== 'COMPLETED')
    || !drawingDate
    || !endDate
    || !updatedAt
  ) {
    return null;
  }

  const competitionImageUrl =
    readNullableString(row.competitionImageUrl)
    ?? readNullableString(row.competition_image_url)
    ?? readNullableString(row.comp_image_url);

  const watchRaw =
    typeof row.watch === 'object' && row.watch !== null
      ? (row.watch as Record<string, unknown>).images
      : undefined;
  let watchImages = normalizeWatchImages(watchRaw, name);
  const legacyWatchImageUrl =
    readNullableString(row.watchImageUrl) ?? readNullableString(row.watch_image_url);
  if (watchImages.length === 0 && legacyWatchImageUrl) {
    watchImages = [{ url: legacyWatchImageUrl, alt: `${name} image` }];
  }

  return {
    id,
    name,
    status,
    drawing_date: drawingDate,
    end_date: endDate,
    updatedAt,
    competitionImageUrl,
    watch: {
      images: watchImages,
    },
    announcementSentAt:
      typeof row.announcementSentAt === 'string' ? row.announcementSentAt : null,
    scheduleAnnouncementSentAt:
      typeof row.scheduleAnnouncementSentAt === 'string'
        ? row.scheduleAnnouncementSentAt
        : null,
  };
}

export type SendAdminCompetitionNotificationResult = {
  kind: 'sent' | 'already_sent' | 'not_active' | 'no_recipients' | 'delivery_failed';
  competitionId: string;
  competitionName: string;
  sentAt?: string;
  attempted?: number;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
  legacyTokenCount?: number;
};

export type SendAdminCompetitionScheduleNotificationResult = {
  kind: 'sent' | 'already_sent' | 'no_recipients' | 'delivery_failed';
  competitionId: string;
  competitionName: string;
  sentAt?: string;
  attempted?: number;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
  legacyTokenCount?: number;
};

export type DrawReminderTargetCompetition = Pick<
  Competition,
  'id' | 'name' | 'drawingDate' | 'endDate' | 'drawScheduleVersion'
>;

function toCompetitionArray(payload: unknown): Competition[] | null {
  if (Array.isArray(payload)) {
    return payload as Competition[];
  }
  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as { data?: unknown };
    if (Array.isArray(candidate.data)) {
      return candidate.data as Competition[];
    }
  }
  return null;
}

function normalizeDrawsTimelineSeed(raw: unknown): DrawsTimelineSeed | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const root = raw as { data?: unknown };
  const d = root.data;
  if (typeof d !== 'object' || d === null) {
    return null;
  }
  const o = d as Record<string, unknown>;
  const past = o.past;
  const upcoming = o.upcoming;
  if (
    !Array.isArray(past)
    || !Array.isArray(upcoming)
    || typeof o.hasMorePast !== 'boolean'
    || typeof o.hasMoreFuture !== 'boolean'
  ) {
    return null;
  }
  return {
    past: past as Competition[],
    upcoming: upcoming as Competition[],
    hasMorePast: o.hasMorePast,
    hasMoreFuture: o.hasMoreFuture,
  };
}

function normalizeDrawsTimelinePage(raw: unknown): DrawsTimelinePage | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const root = raw as { data?: unknown };
  const d = root.data;
  if (typeof d !== 'object' || d === null) {
    return null;
  }
  const o = d as Record<string, unknown>;
  const items = o.items;
  if (!Array.isArray(items) || typeof o.hasMore !== 'boolean') {
    return null;
  }
  return { items: items as Competition[], hasMore: o.hasMore };
}

export type RedeemFreeTicketOutcome =
  | { kind: 'ok'; data: RedeemFreeTicketResult }
  | { kind: 'sign_in_required' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error' };

async function redeemFreeTicket(competitionId: string): Promise<RedeemFreeTicketOutcome> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(
      buildMobileApiRequestUrl(
        `/api/mobile/v1/competitions/${encodeURIComponent(competitionId)}/redeem-free-ticket`,
      ),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...mobileAuthHeaders(),
        },
      },
    );

    if (response.status === 401) {
      await clearMobileSession();
      return { kind: 'sign_in_required' };
    }

    if (response.status === 400 || response.status === 404) {
      let message = 'Could not redeem your free ticket.';
      try {
        const j = (await response.json()) as { error?: unknown };
        if (typeof j.error === 'string' && j.error.trim()) {
          message = j.error;
        }
      } catch {
        /* use default */
      }
      return { kind: 'invalid', message };
    }

    if (!response.ok) {
      return { kind: 'error' };
    }

    const json = (await response.json()) as ApiDataResponse<RedeemFreeTicketResult>;
    if (!json?.data || typeof json.data.orderId !== 'string') {
      return { kind: 'error' };
    }

    return { kind: 'ok', data: json.data };
  } catch {
    return { kind: 'error' };
  }
}

export const mobileDataService = {
  listCompetitions: async (): Promise<Competition[]> => {
    const endpoints = [
      '/api/mobile/v1/competitions',
      '/api/mobile/competitions',
    ];

    let firstResult: Competition[] | null = null;

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient<unknown>(endpoint);
        const parsed = toCompetitionArray(response);
        if (!parsed) {
          continue;
        }
        if (firstResult == null) {
          firstResult = parsed;
        }
        if (parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Continue to next compatible endpoint.
      }
    }

    return firstResult ?? [];
  },
  listDrawsTimelineSeed: async (params?: {
    takePast?: number;
    takeFuture?: number;
  }): Promise<DrawsTimelineSeed | null> => {
    const search = new URLSearchParams();
    if (params?.takePast != null) {
      search.set('takePast', String(params.takePast));
    }
    if (params?.takeFuture != null) {
      search.set('takeFuture', String(params.takeFuture));
    }
    const q = search.toString();
    const endpoint = `/api/mobile/v1/draws${q ? `?${q}` : ''}`;

    try {
      const response = await apiClient<unknown>(endpoint);
      return normalizeDrawsTimelineSeed(response);
    } catch {
      return null;
    }
  },
  listDrawsTimelineBefore: async (
    beforeIso: string,
    take = 15,
  ): Promise<DrawsTimelinePage | null> => {
    const search = new URLSearchParams();
    search.set('before', beforeIso);
    search.set('take', String(take));
    const endpoint = `/api/mobile/v1/draws?${search.toString()}`;

    try {
      const response = await apiClient<unknown>(endpoint);
      return normalizeDrawsTimelinePage(response);
    } catch {
      return null;
    }
  },
  listDrawsTimelineAfter: async (
    afterIso: string,
    take = 15,
  ): Promise<DrawsTimelinePage | null> => {
    const search = new URLSearchParams();
    search.set('after', afterIso);
    search.set('take', String(take));
    const endpoint = `/api/mobile/v1/draws?${search.toString()}`;

    try {
      const response = await apiClient<unknown>(endpoint);
      return normalizeDrawsTimelinePage(response);
    } catch {
      return null;
    }
  },
  getCompetition: async (id?: string): Promise<Competition | undefined> => {
    if (!id) {
      return undefined;
    }
    const response = await apiClient<ApiDataResponse<Competition>>(
      `/api/mobile/v1/competitions/${id}`,
    );
    return response.data;
  },
  loadAccountSummary,
  loadMobileProfile,
  updateMobileProfile,
  getCalendarFeedSubscription: async (): Promise<CalendarFeedSubscription> => {
    const response = await apiClient<ApiDataResponse<CalendarFeedSubscription>>(
      '/api/mobile/v1/me/calendar-feed',
    );
    return response.data;
  },
  regenerateCalendarFeedToken: async (): Promise<CalendarFeedSubscription> => {
    const response = await apiClient<ApiDataResponse<CalendarFeedSubscription>>(
      '/api/mobile/v1/me/calendar-feed',
      { method: 'POST' },
    );
    return response.data;
  },
  revokeCalendarFeedToken: async (): Promise<void> => {
    await apiClient<{ ok: boolean }>('/api/mobile/v1/me/calendar-feed', {
      method: 'DELETE',
    });
  },
  listAdminCompetitionSchedules: async (): Promise<AdminCompetitionScheduleRow[]> => {
    const response = await apiClient<ApiDataResponse<unknown[]>>(
      '/api/admin/v1/competitions',
    );
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid competitions response from server');
    }
    return response.data
      .map((row) => normalizeAdminCompetitionScheduleRow(row))
      .filter((row): row is AdminCompetitionScheduleRow => row !== null);
  },
  updateAdminCompetitionSchedule: async (
    competitionId: string,
    payload: UpdateAdminCompetitionSchedulePayload,
  ): Promise<AdminCompetitionScheduleRow> => {
    const response = await apiClient<ApiDataResponse<unknown>>(
      `/api/admin/v1/competitions/${encodeURIComponent(competitionId)}/schedule`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    const normalized = normalizeAdminCompetitionScheduleRow(response.data);
    if (!normalized) {
      throw new Error('Invalid competition schedule response from server');
    }
    return normalized;
  },
  sendAdminCompetitionNotification: async (
    competitionId: string,
  ): Promise<SendAdminCompetitionNotificationResult> => {
    const response = await fetch(
      buildMobileApiRequestUrl(
        `/api/admin/v1/competitions/${encodeURIComponent(competitionId)}/notify`,
      ),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...mobileAuthHeaders(),
        },
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      data?: SendAdminCompetitionNotificationResult;
      error?: unknown;
    };

    if (payload.data) {
      return payload.data;
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      throw new Error(payload.error);
    }

    throw new Error(`Notification request failed (${response.status})`);
  },
  sendAdminCompetitionScheduleNotification: async (
    competitionId: string,
  ): Promise<SendAdminCompetitionScheduleNotificationResult> => {
    const response = await fetch(
      buildMobileApiRequestUrl(
        `/api/admin/v1/competitions/${encodeURIComponent(competitionId)}/notify-schedule`,
      ),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...mobileAuthHeaders(),
        },
      },
    );

    const payload = (await response.json().catch(() => ({}))) as {
      data?: SendAdminCompetitionScheduleNotificationResult;
      error?: unknown;
    };

    if (payload.data) {
      return payload.data;
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      throw new Error(payload.error);
    }

    throw new Error(`Schedule notification request failed (${response.status})`);
  },
  redeemFreeTicket,
  listReferralUsages,
  listOrderHistory: async (): Promise<OrderSummary[]> => {
    const response = await apiClient<ApiDataResponse<OrderSummary[]>>(
      '/api/mobile/v1/orders/history',
    );
    return response.data;
  },
  listReminderTargetCompetitions: async (): Promise<DrawReminderTargetCompetition[]> => {
    if (!getMobileSessionToken()) {
      return [];
    }

    const [competitions, orders] = await Promise.all([
      mobileDataService.listCompetitions().catch(() => [] as Competition[]),
      mobileDataService.listOrderHistory().catch(() => [] as OrderSummary[]),
    ]);

    const competitionById = new Map<string, DrawReminderTargetCompetition>();
    for (const competition of competitions) {
      const id = competition.id.trim();
      if (!id) {
        continue;
      }
      competitionById.set(id, {
        id,
        name: competition.name,
        drawingDate: competition.drawingDate,
        endDate: competition.endDate,
        drawScheduleVersion: competition.drawScheduleVersion,
      });
    }

    const ticketIds = new Set<string>();
    for (const order of orders) {
      const id = order.competitionId.trim();
      if (id) {
        ticketIds.add(id);
      }
    }

    const subscriptionChecks = await mobileDataService
      .listDrawAlertSubscribedCompetitionIds(competitions.map((competition) => competition.id))
      .catch(() => [] as string[]);

    const targetIds = new Set<string>(ticketIds);
    for (const id of subscriptionChecks) {
      if (id) {
        targetIds.add(id);
      }
    }

    const missingIds = [...targetIds].filter((id) => !competitionById.has(id));
    if (missingIds.length > 0) {
      const missingCompetitions = await Promise.all(
        missingIds.map((id) => mobileDataService.getCompetition(id).catch(() => undefined)),
      );
      for (const competition of missingCompetitions) {
        if (!competition) {
          continue;
        }
        const id = competition.id.trim();
        if (!id) {
          continue;
        }
        competitionById.set(id, {
          id,
          name: competition.name,
          drawingDate: competition.drawingDate,
          endDate: competition.endDate,
          drawScheduleVersion: competition.drawScheduleVersion,
        });
      }
    }

    return [...targetIds]
      .map((id) => competitionById.get(id))
      .filter((competition): competition is DrawReminderTargetCompetition => Boolean(competition));
  },
  listWinners: async (params?: {
    skip?: number;
    take?: number;
  }): Promise<ListWinnersResponse> => {
    const search = new URLSearchParams();
    if (params?.skip != null) {
      search.set('skip', String(params.skip));
    }
    if (params?.take != null) {
      search.set('take', String(params.take));
    }
    const query = search.toString();
    const suffix = query ? `?${query}` : '';
    const endpoint = `/api/mobile/v1/winners${suffix}`;

    try {
      const response = await apiClient<unknown>(endpoint);
      return normalizeWinnersResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown winners API error.';
      throw new WinnersRequestError(
        `Failed to fetch winners from ${endpoint}.`,
        [message],
      );
    }
  },
  getHomeStats: async (): Promise<HomeStats> => {
    try {
      const response = await apiClient<unknown>('/api/mobile/v1/home/stats');
      return normalizeHomeStats(response);
    } catch {
      return {
        instagramFollowers: '',
        amountWon: 0,
      };
    }
  },
  syncPushTokenIfPermitted: async () => syncPushTokenIfPermitted(),
  ensurePushRegisteredForAlerts: async () => ensurePushRegisteredForAlerts(),
  obtainPushToken: async (options?: { prompt?: boolean }) => obtainPushToken(options),
  requestPushPermissionAndRegister: async () => {
    const result = await requestPushPermissionAndRegister();
    return result.ok;
  },
  getDrawAlertSubscribed: async (competitionId: string): Promise<boolean> => {
    if (!API_BASE_URL || !getMobileSessionToken()) {
      return false;
    }
    try {
      const response = await fetch(
        buildMobileApiRequestUrl(
          `/api/mobile/v1/competitions/${encodeURIComponent(competitionId)}/draw-alert`,
        ),
        {
          headers: {
            'Content-Type': 'application/json',
            ...mobileAuthHeaders(),
          },
        },
      );
      if (response.status === 401) {
        return false;
      }
      if (!response.ok) {
        return false;
      }
      const json = (await response.json()) as ApiDataResponse<{ subscribed: boolean }>;
      return Boolean(json?.data?.subscribed);
    } catch {
      return false;
    }
  },
  listDrawAlertSubscribedCompetitionIds: async (competitionIds: string[]): Promise<string[]> => {
    if (!competitionIds.length) {
      return [];
    }

    try {
      const response = await apiClient<ApiDataResponse<{ competitionIds: string[] }>>(
        '/api/mobile/v1/competitions/draw-alerts',
        {
          method: 'POST',
          body: JSON.stringify({ competitionIds }),
        },
      );

      if (!Array.isArray(response?.data?.competitionIds)) {
        return [];
      }

      return response.data.competitionIds
        .map((id) => id.trim())
        .filter((id): id is string => id.length > 0);
    } catch {
      return [];
    }
  },
  subscribeDrawAlert: async (
    competitionId: string,
    push?: {
      token: string;
      platform: 'ios' | 'android';
      apnsEnvironment?: 'sandbox' | 'production';
    },
  ): Promise<void> => {
    await apiClient<{ ok: boolean }>(
      `/api/mobile/v1/competitions/${encodeURIComponent(competitionId)}/draw-alert`,
      {
        method: 'POST',
        body: JSON.stringify(
          push
            ? { ...push, delivery: 'push' as const }
            : { delivery: 'local' as const },
        ),
      },
    );
  },
  unsubscribeDrawAlert: async (competitionId: string): Promise<void> => {
    await apiClient<{ ok: boolean }>(
      `/api/mobile/v1/competitions/${encodeURIComponent(competitionId)}/draw-alert`,
      { method: 'DELETE' },
    );
  },
};
