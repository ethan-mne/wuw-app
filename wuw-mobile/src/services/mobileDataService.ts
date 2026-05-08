import { apiClient } from './apiClient';
import type { AccountSummary, Competition, OrderSummary, Winner } from '../types';

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
  getCompetition: async (id?: string): Promise<Competition | undefined> => {
    if (!id) {
      return undefined;
    }
    const response = await apiClient<ApiDataResponse<Competition>>(
      `/api/mobile/v1/competitions/${id}`,
    );
    return response.data;
  },
  getAccountSummary: async (): Promise<AccountSummary> => {
    const response = await apiClient<ApiDataResponse<AccountSummary>>(
      '/api/mobile/v1/me/summary',
    );
    return response.data;
  },
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
