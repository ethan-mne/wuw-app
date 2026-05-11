export type CheckoutFlowState = {
  quantity: number;
  answer: string | null;
  discountPercent: number;
  timedOut?: boolean;
};

export const CHECKOUT_FLOW_DEFAULTS: CheckoutFlowState = {
  quantity: 1,
  answer: null,
  discountPercent: 0,
  timedOut: false,
};
