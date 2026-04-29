import { describe, expect, it } from 'vitest';
import {
  locales,
  Formater,
  DateFormater,
  cn,
  calculateTotal,
  calculateOddsString,
} from './utils';
import type { ReferalType } from './types';

describe('locales', () => {
  it('contains all expected locales', () => {
    expect(locales).toEqual(['en', 'es', 'fr', 'ja', 'il']);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('resolves tailwind conflicts by keeping the last one', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('merges tailwind classes without conflict', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('Formater', () => {
  it('formats 1000 as GBP in en locale', () => {
    expect(Formater(1000)).toBe('£1,000.00');
  });

  it('formats 0 correctly', () => {
    expect(Formater(0)).toBe('£0.00');
  });

  it('formats decimal values', () => {
    expect(Formater(19.99)).toBe('£19.99');
  });

  it('formats large numbers', () => {
    expect(Formater(1000000)).toBe('£1,000,000.00');
  });
});

describe('DateFormater', () => {
  it('formats a summer date with BST (UTC+1)', () => {
    const date = new Date('2024-06-15T12:30:45Z');
    const result = DateFormater(date);
    expect(result).toBe('06/15/2024, 13:30:45');
  });

  it('formats a winter date with GMT', () => {
    const date = new Date('2024-01-15T12:30:45Z');
    const result = DateFormater(date);
    expect(result).toBe('01/15/2024, 12:30:45');
  });
});

describe('calculateTotal', () => {
  const unitPrice = 10;

  it('returns no discount for less than 15 tickets', () => {
    expect(calculateTotal(5, unitPrice)).toEqual({ total: 50, reduction: 0 });
  });

  it('applies 10% discount for 15 tickets', () => {
    const result = calculateTotal(15, unitPrice);
    expect(result).toEqual({ total: 135, reduction: 0.1 });
  });

  it('applies 10% discount for 19 tickets', () => {
    const result = calculateTotal(19, unitPrice);
    expect(result.reduction).toBe(0.1);
    expect(result.total).toBe(19 * 10 * 0.9);
  });

  it('applies 15% discount for 20 tickets', () => {
    const result = calculateTotal(20, unitPrice);
    expect(result).toEqual({ total: 170, reduction: 0.15 });
  });

  it('applies 15% discount for 24 tickets', () => {
    const result = calculateTotal(24, unitPrice);
    expect(result.reduction).toBe(0.15);
    expect(result.total).toBe(24 * 10 * 0.85);
  });

  it('applies 20% discount for 25 tickets', () => {
    const result = calculateTotal(25, unitPrice);
    expect(result).toEqual({ total: 200, reduction: 0.2 });
  });

  it('applies 20% discount for 49 tickets', () => {
    const result = calculateTotal(49, unitPrice);
    expect(result.reduction).toBe(0.2);
    expect(result.total).toBe(49 * 10 * 0.8);
  });

  it('applies 25% discount for 50 tickets', () => {
    const result = calculateTotal(50, unitPrice);
    expect(result).toEqual({ total: 375, reduction: 0.25 });
  });

  it('applies 25% discount for 100 tickets', () => {
    const result = calculateTotal(100, unitPrice);
    expect(result.reduction).toBe(0.25);
    expect(result.total).toBe(100 * 10 * 0.75);
  });

  it('applies coupon discount for less than 15 tickets', () => {
    const coupon: ReferalType = {
      code: 'TEST1234',
      user_id: 'user-1',
      discount_rate: 0.1,
      usage_counter: 0,
    };
    const result = calculateTotal(5, unitPrice, coupon);
    expect(result.total).toBe(45);
    expect(result.reduction).toBe(0);
  });

  it('nullifies coupon at 15+ tickets', () => {
    const coupon: ReferalType = {
      code: 'TEST1234',
      user_id: 'user-1',
      discount_rate: 0.5,
      usage_counter: 0,
    };
    const result = calculateTotal(15, unitPrice, coupon);
    expect(result.total).toBe(135);
    expect(result.reduction).toBe(0.1);
  });

  it('nullifies coupon at 20 tickets', () => {
    const coupon: ReferalType = {
      code: 'TEST1234',
      user_id: 'user-1',
      discount_rate: 0.2,
      usage_counter: 0,
    };
    const result = calculateTotal(20, unitPrice, coupon);
    expect(result.total).toBe(20 * 10 * 0.85);
    expect(result.reduction).toBe(0.15);
  });

  it('handles null coupon', () => {
    expect(calculateTotal(5, unitPrice, null)).toEqual({
      total: 50,
      reduction: 0,
    });
  });

  it('handles zero tickets', () => {
    expect(calculateTotal(0, unitPrice)).toEqual({ total: 0, reduction: 0 });
  });
});

describe('calculateOddsString', () => {
  it('keeps single-winner behavior when maxWinners is omitted', () => {
    expect(calculateOddsString(15, 800)).toBe('1/53');
  });

  it('keeps single-winner behavior when single winner is specified', () => {
    expect(calculateOddsString(15, 800, 1)).toBe('1/53');
  });

  it('treats non-positive max winners as 1', () => {
    expect(calculateOddsString(15, 800, 0)).toBe('1/53');
  });

  it('scales odds for multiple winners', () => {
    expect(calculateOddsString(15, 800, 2)).toBe('1/27');
  });

  it('rounds denominator to nearest integer', () => {
    expect(calculateOddsString(7, 100, 2)).toBe('1/7');
  });

  it('returns zero for non-positive tickets', () => {
    expect(calculateOddsString(0, 800, 2)).toBe('0');
  });

  it('returns zero for non-positive total tickets', () => {
    expect(calculateOddsString(10, 0, 2)).toBe('0');
  });

  it('caps bought tickets to total tickets before scaling', () => {
    expect(calculateOddsString(1000, 800, 2)).toBe('1/1');
  });

  it('clamps denominator to infinity for very large winners', () => {
    expect(calculateOddsString(15, 800, 100)).toBe('1/Infinity');
  });
});
