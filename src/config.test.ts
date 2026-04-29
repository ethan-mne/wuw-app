import { describe, expect, it } from 'vitest';
import { locales, pathnames, localePrefix } from './config';

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

  describe('pathnames', () => {
    it('has the root path', () => {
      expect(pathnames['/']).toBe('/');
    });

    it('has /competitions path', () => {
      expect(pathnames['/competitions']).toBe('/competitions');
    });

    it('has /about-us path', () => {
      expect(pathnames['/about-us']).toBe('/about-us');
    });

    it('has /faq path', () => {
      expect(pathnames['/faq']).toBe('/faq');
    });

    it('has /winners path', () => {
      expect(pathnames['/winners']).toBe('/winners');
    });

    it('has /privacy-policy path', () => {
      expect(pathnames['/privacy-policy']).toBe('/privacy-policy');
    });

    it('has /terms-and-conditions path', () => {
      expect(pathnames['/terms-and-conditions']).toBe('/terms-and-conditions');
    });

    it('has /contact-us path', () => {
      expect(pathnames['/contact-us']).toBe('/contact-us');
    });

    it('has /competitions/:id path', () => {
      expect(pathnames['/competitions/:id']).toBe('/competitions/:id');
    });

    it('has /account/dashboard path', () => {
      expect(pathnames['/account/dashboard']).toBe('/account/dashboard');
    });

    it('has /howtoplay path', () => {
      expect(pathnames['/howtoplay']).toBe('/howtoplay');
    });
  });

  describe('localePrefix', () => {
    it('is set to always', () => {
      expect(localePrefix).toBe('always');
    });
  });
});
