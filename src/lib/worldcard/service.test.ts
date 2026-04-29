import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Order } from '@prisma/client';
import { order_paymentMethod, order_status } from '@/lib/prisma-enums';

vi.mock('@/env', () => ({
  env: {
    WORLD_CARD_ENTITY_ID: 'test-entity-id',
    WORLD_CARD_URL: 'https://test.worldcard.com',
    WORLD_CARD_AUTH_BEARER: 'test-bearer-token',
  },
}));

vi.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

import { initializePayment, getPaymentStatus, getStatusCode } from './service';

describe('getStatusCode', () => {
  it('should return "Transaction succeeded" for code 000.000.000', () => {
    expect(getStatusCode('000.000.000')).toEqual({
      code: '000.000.000',
      description: 'Transaction succeeded',
    });
  });

  it('should return "successful request" for code 000.000.100', () => {
    expect(getStatusCode('000.000.100')).toEqual({
      code: '000.000.100',
      description: 'successful request',
    });
  });

  it('should return description containing "Integrator Test Mode" for code 000.100.110', () => {
    const result = getStatusCode('000.100.110');
    expect(result?.description).toContain('Integrator Test Mode');
  });

  it('should return undefined for an unknown code', () => {
    expect(getStatusCode('999.888.777')).toBeUndefined();
  });
});

describe('initializePayment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockOrder: Order = {
    id: 'order-1',
    first_name: 'John',
    last_name: 'Doe',
    country: 'GB',
    address: '123 Test St',
    town: 'London',
    zip: 'SW1A 1AA',
    phone: '+441234567890',
    email: 'john@example.com',
    date: new Date(),
    paymentMethod: order_paymentMethod.WORLDCARD,
    checkedEmail: true,
    checkedTerms: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalPrice: 100,
    status: order_status.PENDING,
    paymentId: null,
    intentId: null,
    affiliationId: null,
    runUpPrizeId: null,
    coupon: null,
    utm: null,
    challenge_answer: false,
  };

  it('should successfully initialize a payment', async () => {
    const mockResponse = {
      result: {
        code: '000.200.100',
        description: 'successfully created checkout',
      },
      buildNumber: 'build-123',
      timestamp: '2025-01-01 00:00:00+0000',
      ndc: 'test-ndc',
      id: 'checkout-id-123',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await initializePayment(
      mockOrder,
      'https://example.com/success',
    );

    expect(result.data).toBeTruthy();
    expect(result.error).toBeNull();
    expect(result.data?.merchantTransactionId).toBe('mock-uuid-1234');
    expect(fetch).toHaveBeenCalledWith(
      'https://test.worldcard.com/v1/checkouts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-bearer-token',
        }),
      }),
    );
  });

  it('should handle API error response', async () => {
    const mockErrorResponse = {
      result: {
        code: '200.300.404',
        description: 'invalid or missing parameter',
      },
      buildNumber: 'build-123',
      timestamp: '2025-01-01 00:00:00+0000',
      ndc: 'test-ndc',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse),
      }),
    );

    const result = await initializePayment(
      mockOrder,
      'https://example.com/success',
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('should handle fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const result = await initializePayment(
      mockOrder,
      'https://example.com/success',
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error?.result.code).toBe('999.999.999');
    expect(result.error?.result.description).toBe(
      'Payment initialization failed',
    );
  });
});

describe('getPaymentStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully retrieve payment status', async () => {
    const mockResponse = {
      result: {
        code: '000.000.000',
        description: 'Transaction succeeded',
      },
      buildNumber: 'build-123',
      timestamp: '2025-01-01 00:00:00+0000',
      ndc: 'test-ndc',
      id: 'payment-id-123',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await getPaymentStatus('checkout-id-123');

    expect(result.data).toBeTruthy();
    expect(result.error).toBeNull();
    expect(result.data.isSuccess).toBe(true);
    expect(result.data.isPending).toBe(false);
    expect(result.data.isError).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      'https://test.worldcard.com/v1/checkouts/checkout-id-123/payment?entityId=test-entity-id',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('should handle invalid response format', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      }),
    );

    const result = await getPaymentStatus('checkout-id-123');

    expect(result.data.isSuccess).toBe(false);
    expect(result.data.isError).toBe(true);
    expect(result.error).toBeTruthy();
  });
});
