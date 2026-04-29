import { describe, expect, it } from 'vitest';
import { formatPrice, formatCurrency } from './formaters';

describe('formatPrice', () => {
  it('returns £999 for 999', () => {
    expect(formatPrice(999)).toBe('£999');
  });

  it('returns £1k for 1000', () => {
    expect(formatPrice(1000)).toBe('£1k');
  });

  it('returns £1.5k for 1500', () => {
    expect(formatPrice(1500)).toBe('£1.5k');
  });

  it('returns £2k for 2000', () => {
    expect(formatPrice(2000)).toBe('£2k');
  });

  it('returns £10k for 10000', () => {
    expect(formatPrice(10000)).toBe('£10k');
  });

  it('returns £500 for 500', () => {
    expect(formatPrice(500)).toBe('£500');
  });

  it('returns £0 for 0', () => {
    expect(formatPrice(0)).toBe('£0');
  });

  it('returns £2.5k for 2500', () => {
    expect(formatPrice(2500)).toBe('£2.5k');
  });

  it('returns £100k for 100000', () => {
    expect(formatPrice(100000)).toBe('£100k');
  });
});

describe('formatCurrency', () => {
  it('formats 1000 as GBP', () => {
    const result = formatCurrency(1000);
    expect(result).toBe('£1,000');
  });

  it('formats 0', () => {
    expect(formatCurrency(0)).toBe('£0');
  });

  it('formats decimal values', () => {
    const result = formatCurrency(19.99);
    expect(result).toBe('£19.99');
  });

  it('formats whole number without decimals', () => {
    const result = formatCurrency(50);
    expect(result).toBe('£50');
  });

  it('formats large numbers with commas', () => {
    const result = formatCurrency(1000000);
    expect(result).toBe('£1,000,000');
  });
});
