import { describe, it, expect } from 'vitest';
import { TestMode, cardBrands } from './config';

describe('config', () => {
  it('TestMode should be true', () => {
    expect(TestMode).toBe(true);
  });

  it('cardBrands should contain VISA, MASTER, and APPLEPAY', () => {
    expect(cardBrands).toContain('VISA');
    expect(cardBrands).toContain('MASTER');
    expect(cardBrands).toContain('APPLEPAY');
  });

  it('cardBrands should have exactly 3 items', () => {
    expect(cardBrands).toHaveLength(3);
  });
});
