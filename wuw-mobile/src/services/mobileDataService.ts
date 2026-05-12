import { apiClient } from './apiClient';
import { API_BASE_URL } from '../lib/config';
import { mobileAuthHeaders, setMobileSessionToken } from '../lib/mobileSessionToken';
import type {
  AccountSummary,
  Competition,
  MobileUserProfile,
  OrderSummary,
  ReferralUsageItem,
  Winner,
} from '../types';

type ApiDataResponse<T> = {
  data: T;
};

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

export type LoadAccountSummaryResult =
  | { kind: 'ok'; data: AccountSummary }
  | { kind: 'sign_in_required' }
  | { kind: 'error' };

async function loadAccountSummary(): Promise<LoadAccountSummaryResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/v1/me/summary`, {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      setMobileSessionToken(null);
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
  };
}

async function loadMobileProfile(): Promise<LoadMobileProfileResult> {
  if (!API_BASE_URL) {
    return { kind: 'error' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/v1/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      setMobileSessionToken(null);
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
    const response = await fetch(`${API_BASE_URL}/api/mobile/v1/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      setMobileSessionToken(null);
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
    const response = await fetch(`${API_BASE_URL}/api/mobile/v1/referrals/usage`, {
      headers: {
        'Content-Type': 'application/json',
        ...mobileAuthHeaders(),
      },
    });

    if (response.status === 401) {
      setMobileSessionToken(null);
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
  listReferralUsages,
  listOrderHistory: async (): Promise<OrderSummary[]> => {
    const response = await apiClient<ApiDataResponse<OrderSummary[]>>(
      '/api/mobile/v1/orders/history',
    );
    return response.data;
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
};
