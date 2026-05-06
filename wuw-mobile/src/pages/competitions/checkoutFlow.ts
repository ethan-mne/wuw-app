export type CheckoutFlowState = {
  quantity: number;
  answer: string | null;
  timedOut?: boolean;
};

export const CHECKOUT_FLOW_DEFAULTS: CheckoutFlowState = {
  quantity: 1,
  answer: null,
  timedOut: false,
};

export const CHECKOUT_QUESTION_OPTIONS = [
  'Rolex Submariner',
  'Omega Speedmaster',
  'Patek Philippe Nautilus',
  'Audemars Piguet Royal Oak',
] as const;
