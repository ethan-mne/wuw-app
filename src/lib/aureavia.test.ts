import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'crypto';

vi.mock('@/env', () => ({
  env: {
    AUREAVIA_HASH_KEY: '9HGIEL17IX',
    AUREAVIA_MERCHANT_ID: '146',
  },
}));

import { verifyAureaviaSignature, type AureaviaNotification } from './aureavia';

// Test configuration
const AUREAVIA_HASH_KEY = '9HGIEL17IX';
const AUREAVIA_MERCHANT_ID = '146';

// Helper function to generate a valid signature - matches the implementation in aureavia.ts
const generateSignature = (payload: {
  trans_id: string;
  trans_order: string;
  reply_code: string;
  trans_amount: string;
  trans_currency: string;
}) => {
  const dataString =
    payload.trans_id +
    payload.trans_order +
    payload.reply_code +
    payload.trans_amount +
    payload.trans_currency +
    AUREAVIA_HASH_KEY;

  return createHash('sha256').update(dataString).digest('base64');
};

describe('Aureavia Payment Notification Signature Verification', () => {
  const basePayload: Omit<AureaviaNotification, 'signature'> = {
    reply_code: '581',
    reply_desc: 'Country is blocked',
    trans_id: '1056545',
    trans_date: '12/22/2024 4:15:48 PM',
    trans_amount: '243.972',
    trans_currency: 'EUR',
    trans_order: '0ae7d1e2-493c-496c-a678-5f842bbe1bab-j63lj0',
    merchant_id: '6616716',
    client_fullname: 'Jonathan david pinto',
    client_phone: '664416528',
    client_email: 'jonathan.pinto@jds-associes.com',
    payment_details: 'Visa .... 5014',
    trans_type: '0',
    debit_company: '146',
    debrefnum: 'REF123ABC',
    bin_country: 'US',
    pm: '22',
    StorageID: '',
    ExpMonth: '09',
    ExpYear: '27',
  };

  describe('Valid Signatures', () => {
    it('should verify a valid payment notification signature', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const validPayload = {
        ...basePayload,
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(validPayload, AUREAVIA_HASH_KEY)).toBe(
        true,
      );
    });

    it('should verify signature with zero amount transaction', () => {
      const zeroAmountPayload = {
        ...basePayload,
        trans_amount: '0.00',
      };

      const validSignature = generateSignature({
        trans_id: zeroAmountPayload.trans_id,
        trans_order: zeroAmountPayload.trans_order,
        reply_code: zeroAmountPayload.reply_code,
        trans_amount: zeroAmountPayload.trans_amount,
        trans_currency: zeroAmountPayload.trans_currency,
      });

      expect(
        verifyAureaviaSignature(
          { ...zeroAmountPayload, signature: validSignature },
          AUREAVIA_HASH_KEY,
        ),
      ).toBe(true);
    });

    it('should verify signature with high value transaction', () => {
      const highValuePayload = {
        ...basePayload,
        trans_amount: '999999.99',
      };

      const validSignature = generateSignature({
        trans_id: highValuePayload.trans_id,
        trans_order: highValuePayload.trans_order,
        reply_code: highValuePayload.reply_code,
        trans_amount: highValuePayload.trans_amount,
        trans_currency: highValuePayload.trans_currency,
      });

      expect(
        verifyAureaviaSignature(
          { ...highValuePayload, signature: validSignature },
          AUREAVIA_HASH_KEY,
        ),
      ).toBe(true);
    });
  });

  describe('Invalid Signatures', () => {
    it('should reject when signature is tampered', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const tamperedSignature = validSignature.slice(0, -1) + 'X';
      const payload = {
        ...basePayload,
        signature: tamperedSignature,
      };

      expect(verifyAureaviaSignature(payload, AUREAVIA_HASH_KEY)).toBe(false);
    });

    it('should reject when transaction amount is modified after signature', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const modifiedPayload = {
        ...basePayload,
        trans_amount: '999.99',
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(modifiedPayload, AUREAVIA_HASH_KEY)).toBe(
        false,
      );
    });

    it('should reject when transaction currency is modified', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const modifiedPayload = {
        ...basePayload,
        trans_currency: 'USD',
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(modifiedPayload, AUREAVIA_HASH_KEY)).toBe(
        false,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty signature', () => {
      const payload = {
        ...basePayload,
        signature: '',
      };

      expect(verifyAureaviaSignature(payload, AUREAVIA_HASH_KEY)).toBe(false);
    });

    it('should reject malformed signature (non-base64)', () => {
      const payload = {
        ...basePayload,
        signature: 'not-a-valid-base64-signature!@#$',
      };

      expect(verifyAureaviaSignature(payload, AUREAVIA_HASH_KEY)).toBe(false);
    });

    it('should reject when using wrong merchant hash key', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const payload = {
        ...basePayload,
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(payload, 'WRONG_HASH_KEY')).toBe(false);
    });
  });

  describe('Transaction Status Verification', () => {
    it('should reject failed transactions with success signature', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const modifiedPayload = {
        ...basePayload,
        reply_code: '100',
        reply_desc: 'FAILED',
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(modifiedPayload, AUREAVIA_HASH_KEY)).toBe(
        false,
      );
    });

    it('should reject cancelled transactions with success signature', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const modifiedPayload = {
        ...basePayload,
        reply_code: '200',
        reply_desc: 'CANCELLED',
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(modifiedPayload, AUREAVIA_HASH_KEY)).toBe(
        false,
      );
    });

    it('should reject pending transactions with success signature', () => {
      const validSignature = generateSignature({
        trans_id: basePayload.trans_id,
        trans_order: basePayload.trans_order,
        reply_code: basePayload.reply_code,
        trans_amount: basePayload.trans_amount,
        trans_currency: basePayload.trans_currency,
      });

      const modifiedPayload = {
        ...basePayload,
        reply_code: '300',
        reply_desc: 'PENDING',
        signature: validSignature,
      };

      expect(verifyAureaviaSignature(modifiedPayload, AUREAVIA_HASH_KEY)).toBe(
        false,
      );
    });
  });
});
