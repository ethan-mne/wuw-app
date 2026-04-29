import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getBaseUrl,
  MAX_TICKETS,
  TICKETREDUC,
  Charities,
  Formater,
  DateFormater,
  CreateOrderFromCartSchema,
  CreateOrderSchema,
  NewOrderCreateSchema,
  CreateOrderStripeSchema,
} from './utils';

vi.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_IS_GOLD: false,
  },
}));

vi.mock('@prisma/client', () => ({
  order_paymentMethod: {
    STRIPE: 'STRIPE',
    PAYPAL: 'PAYPAL',
    AFFILIATION: 'AFFILIATION',
    MARKETING: 'MARKETING',
    WINCOIN: 'WINCOIN',
    AUREAVIA: 'AUREAVIA',
    WORLDCARD: 'WORLDCARD',
    VOUCH_LAB: 'VOUCH_LAB',
  },
  order_status: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    INCOMPLETE: 'INCOMPLETE',
    ATTEMPTED: 'ATTEMPTED',
  },
  CompetitionStatus: {
    ACTIVE: 'ACTIVE',
    NOT_ACTIVE: 'NOT_ACTIVE',
    COMPLETED: 'COMPLETED',
  },
}));
describe('getBaseUrl', () => {
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalPort = process.env.PORT;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalVercelUrl !== undefined) {
      process.env.VERCEL_URL = originalVercelUrl;
    } else {
      delete process.env.VERCEL_URL;
    }
    if (originalPort !== undefined) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
  });

  it('returns empty string when window is defined', () => {
    // jsdom provides window by default
    expect(getBaseUrl()).toBe('');
  });

  it('returns VERCEL_URL when window is undefined and VERCEL_URL is set', () => {
    vi.stubGlobal('window', undefined);
    process.env.VERCEL_URL = 'my-app.vercel.app';
    expect(getBaseUrl()).toBe('https://my-app.vercel.app');
  });

  it('returns localhost with PORT when window is undefined and no VERCEL_URL', () => {
    vi.stubGlobal('window', undefined);
    delete process.env.VERCEL_URL;
    process.env.PORT = '4000';
    expect(getBaseUrl()).toBe('http://localhost:4000');
  });

  it('returns localhost:3000 as default when no VERCEL_URL and no PORT', () => {
    vi.stubGlobal('window', undefined);
    delete process.env.VERCEL_URL;
    delete process.env.PORT;
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});

describe('MAX_TICKETS', () => {
  it('is 50', () => {
    expect(MAX_TICKETS).toBe(50);
  });
});

describe('TICKETREDUC', () => {
  it('has entries for key reduction tiers', () => {
    const tier15 = TICKETREDUC.find((t) => t.value === 15);
    expect(tier15).toEqual({ value: 15, reduction: 0.1 });

    const tier20 = TICKETREDUC.find((t) => t.value === 20);
    expect(tier20).toEqual({ value: 20, reduction: 0.15 });

    const tier25 = TICKETREDUC.find((t) => t.value === 25);
    expect(tier25).toEqual({ value: 25, reduction: 0.2 });

    const tier50 = TICKETREDUC.find((t) => t.value === 50);
    expect(tier50).toEqual({ value: 50, reduction: 0.25 });
  });

  it('has no reduction for small ticket counts', () => {
    const tier1 = TICKETREDUC.find((t) => t.value === 1);
    expect(tier1).toEqual({ value: 1, reduction: 0 });

    const tier5 = TICKETREDUC.find((t) => t.value === 5);
    expect(tier5).toEqual({ value: 5, reduction: 0 });

    const tier10 = TICKETREDUC.find((t) => t.value === 10);
    expect(tier10).toEqual({ value: 10, reduction: 0 });
  });

  it('has entries for values 1 through 10, 15, 20, 25, and 50', () => {
    const values = TICKETREDUC.map((t) => t.value);
    expect(values).toContain(1);
    expect(values).toContain(5);
    expect(values).toContain(10);
    expect(values).toContain(15);
    expect(values).toContain(20);
    expect(values).toContain(25);
    expect(values).toContain(50);
  });
});

describe('Charities', () => {
  it('has 2 entries', () => {
    expect(Charities).toHaveLength(2);
  });

  it('has correct structure for each charity', () => {
    for (const charity of Charities) {
      expect(charity).toHaveProperty('img');
      expect(charity).toHaveProperty('name');
      expect(charity).toHaveProperty('amount');
      expect(charity).toHaveProperty('desc');
      expect(charity).toHaveProperty('link');
      expect(typeof charity.img).toBe('string');
      expect(typeof charity.amount).toBe('number');
      expect(typeof charity.link).toBe('string');
    }
  });

  it('contains the Michael J Fox foundation', () => {
    const mjf = Charities.find((c) => c.link.includes('michaeljfox'));
    expect(mjf).toBeDefined();
    expect(mjf?.name).toBe('heart');
  });

  it('contains the Super Hero association', () => {
    const sh = Charities.find((c) => c.link.includes('superheros'));
    expect(sh).toBeDefined();
    expect(sh?.name).toBe('superhero');
  });
});

describe('Formater (server)', () => {
  it('formats 1000 as GBP currency', () => {
    expect(Formater(1000)).toBe('£1,000.00');
  });

  it('formats 0', () => {
    expect(Formater(0)).toBe('£0.00');
  });
});

describe('DateFormater (server)', () => {
  it('formats a date with full dateStyle and short timeStyle', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = DateFormater(date);
    // Full date style in en locale, Europe/London, h12
    // e.g. "Monday, 15 January 2024 at 12:00 pm"
    expect(result).toContain('Monday');
    expect(result).toContain('January');
    expect(result).toContain('2024');
    expect(result).toContain('12:00');
  });
});

describe('Zod Schemas', () => {
  describe('CreateOrderFromCartSchema', () => {
    it('accepts valid cart order data', () => {
      const data = {
        paymentId: 'pi_123',
        coupon: 'SAVE10',
        utm: 'google',
        challenge_answer: false,
        comps: [
          {
            compID: 'comp-1',
            number_tickets: 2,
            price_per_ticket: 10,
            reduction: 0.1,
          },
        ],
        isGift: false,
      };
      const result = CreateOrderFromCartSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects data missing comps', () => {
      const data = {
        paymentId: 'pi_123',
      };
      const result = CreateOrderFromCartSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateOrderSchema', () => {
    it('accepts valid order data', () => {
      const data = {
        first_name: 'John',
        last_name: 'Doe',
        country: 'UK',
        address: '123 Main St',
        town: 'London',
        zip: 'SW1A 1AA',
        phone: '+44123456789',
        email: 'john@example.com',
        date: new Date(),
        paymentMethod: 'STRIPE',
        checkedEmail: true,
        checkedTerms: true,
        totalPrice: 100,
        comps: [
          {
            compID: 'comp-1',
            number_tickets: 2,
            price_per_ticket: 10,
            affiliation_reduction: 0,
            reduction: 0,
          },
        ],
      };
      const result = CreateOrderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('NewOrderCreateSchema', () => {
    it('accepts valid new order data', () => {
      const data = {
        first_name: 'Jane',
        last_name: 'Smith',
        country: 'UK',
        address: '456 High St',
        town: 'Manchester',
        zip: 'M1 1AA',
        phone: '+44987654321',
        email: 'jane@example.com',
        date: new Date(),
        paymentMethod: 'PAYPAL',
        checkedEmail: false,
        checkedTerms: true,
        totalPrice: 50,
        comps: [
          {
            competitionId: 'comp-2',
            ticketCount: 1,
            totalPrice: 50,
          },
        ],
      };
      const result = NewOrderCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateOrderStripeSchema', () => {
    it('accepts valid stripe order data', () => {
      const data = {
        id: 'order-123',
        first_name: 'John',
        last_name: 'Doe',
        country: 'UK',
        address: '123 Main St',
        town: 'London',
        zip: 'SW1A 1AA',
        phone: '+44123456789',
        email: 'john@example.com',
        date: new Date(),
        paymentMethod: 'STRIPE',
        checkedEmail: true,
        checkedTerms: true,
        totalPrice: 100,
        comps: [
          {
            compID: 'comp-1',
            number_tickets: 2,
            price_per_ticket: 10,
            reduction: 0,
          },
        ],
        locale: 'en',
      };
      const result = CreateOrderStripeSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('defaults locale to en when not provided', () => {
      const data = {
        id: 'order-123',
        first_name: 'John',
        last_name: 'Doe',
        country: 'UK',
        address: '123 Main St',
        town: 'London',
        zip: 'SW1A 1AA',
        phone: '+44123456789',
        email: 'john@example.com',
        date: new Date(),
        paymentMethod: 'STRIPE',
        checkedEmail: true,
        checkedTerms: true,
        totalPrice: 100,
        comps: [
          {
            compID: 'comp-1',
            number_tickets: 2,
            price_per_ticket: 10,
            reduction: 0,
          },
        ],
      };
      const result = CreateOrderStripeSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('en');
      }
    });

    it('rejects invalid locale', () => {
      const data = {
        id: 'order-123',
        first_name: 'John',
        last_name: 'Doe',
        country: 'UK',
        address: '123 Main St',
        town: 'London',
        zip: 'SW1A 1AA',
        phone: '+44123456789',
        email: 'john@example.com',
        date: new Date(),
        paymentMethod: 'STRIPE',
        checkedEmail: true,
        checkedTerms: true,
        totalPrice: 100,
        comps: [
          {
            compID: 'comp-1',
            number_tickets: 2,
            price_per_ticket: 10,
            reduction: 0,
          },
        ],
        locale: 'invalid',
      };
      const result = CreateOrderStripeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
