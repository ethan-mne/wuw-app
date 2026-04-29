export interface MockUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}
export const TestMode = true;

export const cardBrands = [
  'VISA',
  'MASTER',
  // 'AMEX',
  // 'DISCOVER',
  // 'MAESTRO',
  // 'CARTEBLEUE',
  // 'JCB',
  // 'VPAY',
  // 'DINERS',
  // 'UNIONPAY',
  // 'MAESTRO',
  // 'GOOGLEPAY',
  'APPLEPAY',
];

export type PaymentResponse = {
  result: {
    code: string;
    description: string;
  };
  buildNumber: string;
  timestamp: string;
  ndc: string;
  id: string;
  integrity?: string;
  merchantTransactionId: string;
};

export type PaymentError = {
  result: {
    code: string;
    description: string;
  };
};

export type PaymentConfig = {
  entityId: string;
  amount: string;
  currency: string;
  paymentType: string;
  merchantTransactionId: string;
  integrity: 'true';
  merchantReturnUrl: string;
  shopperResultUrl: string;
  testMode?: string;
  paymentBrands?: string;
  customer?: {
    givenName: string;
    surname: string;
    email: string;
    phone: string;
  };
  billing?: {
    street1: string;
    city: string;
    postcode: string;
    country: string;
  };
  notificationUrl?: string;
  customParameters?: Record<string, string>;
};
