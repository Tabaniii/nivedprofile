import { describe, it, expect } from 'vitest';
import { isValidUUID, isValidRating, sanitizeText } from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('accepts valid RFC4122 UUID strings', () => {
      expect(isValidUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')).toBe(true);
      expect(isValidUUID('a23deb4d-4b7d-4bad-9bdd-2b0d7b3dcb6e')).toBe(true);
    });

    it('rejects invalid UUID strings', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6z')).toBe(false);
    });
  });

  describe('isValidRating', () => {
    it('validates 1-3 ratings for internal feedback', () => {
      expect(isValidRating(1, 1, 3)).toBe(true);
      expect(isValidRating(2, 1, 3)).toBe(true);
      expect(isValidRating(3, 1, 3)).toBe(true);
      expect(isValidRating(4, 1, 3)).toBe(false);
      expect(isValidRating(5, 1, 3)).toBe(false);
      expect(isValidRating(0, 1, 3)).toBe(false);
      expect(isValidRating(-1, 1, 3)).toBe(false);
      expect(isValidRating('2.5', 1, 3)).toBe(false);
    });

    it('validates 1-5 ratings for star telemetry', () => {
      expect(isValidRating(1, 1, 5)).toBe(true);
      expect(isValidRating(5, 1, 5)).toBe(true);
      expect(isValidRating(6, 1, 5)).toBe(false);
      expect(isValidRating(0, 1, 5)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('trims whitespace and strips dangerous control characters', () => {
      const raw = '  Hello World\x00\x08  ';
      expect(sanitizeText(raw)).toBe('Hello World');
    });

    it('enforces maximum character limit', () => {
      const longText = 'a'.repeat(3000);
      expect(sanitizeText(longText, 2000).length).toBe(2000);
    });

    it('handles non-string values gracefully', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });
});
