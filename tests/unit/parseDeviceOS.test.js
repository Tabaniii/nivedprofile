import { describe, it, expect } from 'vitest';
import { parseDeviceOS } from '@/lib/device';

describe('parseDeviceOS', () => {
  it('identifies iPhone User-Agent as iOS', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(parseDeviceOS(ua)).toBe('iOS');
  });

  it('identifies iPad User-Agent as iOS', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    expect(parseDeviceOS(ua)).toBe('iOS');
  });

  it('identifies Android User-Agent as Android', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';
    expect(parseDeviceOS(ua)).toBe('Android');
  });

  it('identifies Desktop Windows / Chrome as Other', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseDeviceOS(ua)).toBe('Other');
  });

  it('identifies macOS Desktop Safari as Other', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15';
    expect(parseDeviceOS(ua)).toBe('Other');
  });

  it('gracefully handles empty, null, or non-string inputs as Other', () => {
    expect(parseDeviceOS('')).toBe('Other');
    expect(parseDeviceOS(null)).toBe('Other');
    expect(parseDeviceOS(undefined)).toBe('Other');
    expect(parseDeviceOS(12345)).toBe('Other');
  });
});
