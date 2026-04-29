import type { RouterOutputs } from '@/trpc/shared';

export type profileType = RouterOutputs['Users']['CurrentUser'];
export type historyType = RouterOutputs['Order']['getOrderHistory'];
export type orderType = RouterOutputs['Order']['getOrderDetails'];

export type Gift = {
  email: string;
  fullname: string;
  message: string;
};
//we remove this later since we use raw query to get data, we 'll need just the manually defined type
export type liveCompetitionType = RouterOutputs['Order']['getLiveCompetitions'];
export type ReferalType = RouterOutputs['Referal']['getCouponByCode'];

export type LiveCompetitions = {
  id: string;
  name: string;
  end_date: Date;
  order_id: string;
  img_url: string | null; // Nullable because of the LEFT JOIN with images_url
  ticket_count: number;
}[];

export type ReferralHistoryType = {
  fullname: string;
  comp_name: string;
  createdAt: Date;
}[];

interface AffTracker {
  setWebsiteUrl(url: string): void;
  add_order(orderDetails: {
    order_id: string | number;
    order_currency: string;
    order_total: string;
    product_ids: string | number;
  }): void;
}

declare global {
  interface Window {
    AffTracker?: AffTracker;
  }
}

