import { describe, it, expect } from 'vitest';
import {
  decryptRequest,
  PaymentResponseSchema,
  isValidPaymentCode,
  isPendingPaymentCode,
  isErrorPaymentCode,
} from './webhook';
import { createCipheriv, randomBytes } from 'crypto';

describe('PaymentResponseSchema', () => {
  it('parses valid payment data', () => {
    const data = {
      type: 'PAYMENT',
      payload: {
        id: '8a829449515d198b01517d5601df5584',
        paymentType: 'PA',
        paymentBrand: 'VISA',
        presentationAmount: '92.00',
        presentationCurrency: 'EUR',
        descriptor: '3017.7139.1650 OPP_Channel',
        result: {
          code: '000.000.000',
          description: 'Transaction succeeded',
        },
      },
    };
    const result = PaymentResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('PAYMENT');
      expect(result.data.payload.paymentBrand).toBe('VISA');
    }
  });

  it('rejects invalid type', () => {
    const data = {
      type: 'INVALID',
      payload: {
        id: 'test',
        paymentType: 'PA',
        paymentBrand: 'VISA',
        presentationAmount: '10.00',
        presentationCurrency: 'EUR',
        result: { code: '000.000.000', description: 'ok' },
      },
    };
    expect(PaymentResponseSchema.safeParse(data).success).toBe(false);
  });
});

describe('decryptRequest', () => {
  it('returns error when headers are missing', async () => {
    const { data, error } = await decryptRequest({}, new Headers(), 'secret');
    expect(data).toBeNull();
    expect(error).toContain('Missing required headers');
  });

  it('returns error for invalid body format', async () => {
    const headers = new Headers({
      'x-authentication-tag': 'AABB',
      'x-initialization-vector': 'CCDD',
    });
    const { data, error } = await decryptRequest(
      { bad: 'data' },
      headers,
      'secret',
    );
    expect(data).toBeNull();
    expect(error).toContain('Invalid encrypted body format');
  });

  it('decrypts valid AES-256-GCM payload', async () => {
    const secret = randomBytes(32);
    const iv = randomBytes(12);
    const paymentData = {
      type: 'PAYMENT',
      payload: {
        id: 'test-id',
        paymentType: 'DB',
        paymentBrand: 'VISA',
        presentationAmount: '50.00',
        presentationCurrency: 'GBP',
        result: {
          code: '000.000.000',
          description: 'Transaction succeeded',
        },
      },
    };
    const cipher = createCipheriv('aes-256-gcm', secret, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(paymentData), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const headers = new Headers({
      'x-authentication-tag': authTag.toString('hex').toUpperCase(),
      'x-initialization-vector': iv.toString('hex').toUpperCase(),
    });
    const { data, error } = await decryptRequest(
      { encryptedBody: encrypted.toString('hex').toUpperCase() },
      headers,
      secret.toString('hex'),
    );
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.type).toBe('PAYMENT');
    expect(data!.payload.id).toBe('test-id');
    expect(data!.payload.presentationAmount).toBe('50.00');
    expect(data!.payload.result.code).toBe('000.000.000');
  });

  it('returns error for invalid auth tag', async () => {
    const secret = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', secret, iv);
    const encrypted = Buffer.concat([
      cipher.update('{}', 'utf8'),
      cipher.final(),
    ]);
    cipher.getAuthTag();
    const headers = new Headers({
      'x-authentication-tag': 'DEADBEEFDEADBEEFDEADBEEFDEADBEEF',
      'x-initialization-vector': iv.toString('hex').toUpperCase(),
    });
    const { data, error } = await decryptRequest(
      { encryptedBody: encrypted.toString('hex').toUpperCase() },
      headers,
      secret.toString('hex'),
    );
    expect(data).toBeNull();
    expect(error).toContain('decryption error');
  });
});

describe('isValidPaymentCode', () => {
  it('should return true for successful transaction codes', () => {
    expect(isValidPaymentCode('000.000.000')).toBe(true);
    expect(isValidPaymentCode('000.000.100')).toBe(true);
    expect(isValidPaymentCode('000.100.110')).toBe(true);
    expect(isValidPaymentCode('000.100.111')).toBe(true);
    expect(isValidPaymentCode('000.100.112')).toBe(true);
    expect(isValidPaymentCode('000.300.000')).toBe(true);
    expect(isValidPaymentCode('000.600.000')).toBe(true);
    expect(isValidPaymentCode('000.400.110')).toBe(true);
    expect(isValidPaymentCode('000.400.120')).toBe(true);
  });

  it('should return false for non-success codes', () => {
    expect(isValidPaymentCode('100.100.100')).toBe(false);
    expect(isValidPaymentCode('800.100.100')).toBe(false);
    expect(isValidPaymentCode('999.999.999')).toBe(false);
    expect(isValidPaymentCode('')).toBe(false);
  });
});

describe('isPendingPaymentCode', () => {
  it('should return true for pending codes', () => {
    expect(isPendingPaymentCode('000.200.000')).toBe(true);
    expect(isPendingPaymentCode('000.200.100')).toBe(true);
  });

  it('should return false for non-pending codes', () => {
    expect(isPendingPaymentCode('000.000.000')).toBe(false);
    expect(isPendingPaymentCode('100.200.000')).toBe(false);
    expect(isPendingPaymentCode('')).toBe(false);
  });
});

describe('isErrorPaymentCode', () => {
  it('should return true for chargeback codes', () => {
    expect(isErrorPaymentCode('000.100.200')).toBe(true);
    expect(isErrorPaymentCode('000.100.201')).toBe(true);
  });

  it('should return true for rejected codes', () => {
    expect(isErrorPaymentCode('100.397.000')).toBe(true);
    expect(isErrorPaymentCode('100.396.000')).toBe(true);
    expect(isErrorPaymentCode('100.395.000')).toBe(true);
  });

  it('should return true for external rejection codes', () => {
    expect(isErrorPaymentCode('800.100.000')).toBe(true);
    expect(isErrorPaymentCode('800.700.000')).toBe(true);
    expect(isErrorPaymentCode('800.800.100')).toBe(true);
    expect(isErrorPaymentCode('800.800.200')).toBe(true);
    expect(isErrorPaymentCode('800.800.300')).toBe(true);
  });

  it('should return true for 3D Secure codes', () => {
    expect(isErrorPaymentCode('800.400.200')).toBe(true);
    expect(isErrorPaymentCode('100.390.000')).toBe(true);
  });

  it('should return false for success codes', () => {
    expect(isErrorPaymentCode('000.000.000')).toBe(false);
    expect(isErrorPaymentCode('000.100.110')).toBe(false);
    expect(isErrorPaymentCode('')).toBe(false);
  });
});
