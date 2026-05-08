import { apiClient } from './apiClient';
import type { AccountSummary, Competition, OrderSummary, Winner } from '../types';

type ApiDataResponse<T> = {
  data: T;
};

export type ListWinnersResponse = {
  data: Winner[];
  hasMore: boolean;
};

export const mobileDataService = {
  listCompetitions: async (): Promise<Competition[]> => {
    const response = await apiClient<ApiDataResponse<Competition[]>>(
      '/api/mobile/competitions',
    );
    return response.data;
  },
  getCompetition: async (id?: string): Promise<Competition | undefined> => {
    if (!id) {
      return undefined;
    }
    const response = await apiClient<ApiDataResponse<Competition>>(
      `/api/mobile/competitions/${id}`,
    );
    return response.data;
  },
  getAccountSummary: async (): Promise<AccountSummary> => {
    const response = await apiClient<ApiDataResponse<AccountSummary>>(
      '/api/mobile/me/summary',
    );
    return response.data;
  },
  listOrderHistory: async (): Promise<OrderSummary[]> => {
    const response = await apiClient<ApiDataResponse<OrderSummary[]>>(
      '/api/mobile/orders/history',
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
    return apiClient<ListWinnersResponse>(
      `/api/mobile/winners${query ? `?${query}` : ''}`,
    );
  },
};
