import { describe, expect, it } from 'vitest';
import { locales } from './config';

describe('config', () => {
  describe('locales', () => {
    it('contains en, es, and fr', () => {
      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('fr');
    });

    it('has exactly 3 locales', () => {
      expect(locales).toHaveLength(3);
    });
  });
});
