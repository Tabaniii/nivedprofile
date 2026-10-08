import { describe, it, expect, beforeEach } from 'vitest';
import { shouldLogTap, resetDebounceCache, hashIp, DEBOUNCE_WINDOW_MS } from '@/lib/debounce';

describe('Anti-Spam Debounce Rule (< 5000ms)', () => {
  beforeEach(() => {
    resetDebounceCache();
  });

  it('allows the initial tap at T = 0ms', () => {
    const cardId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const clientIp = '192.168.1.50';
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)';

    const result = shouldLogTap(cardId, clientIp, ua, 1000);
    expect(result).toBe(true);
  });

  it('drops duplicate taps within 5000ms window (TM-13)', () => {
    const cardId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const clientIp = '192.168.1.50';
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)';

    // Request 1 at T = 0ms
    expect(shouldLogTap(cardId, clientIp, ua, 1000)).toBe(true);

    // Request 2 at T = 800ms (< 5s)
    expect(shouldLogTap(cardId, clientIp, ua, 1800)).toBe(false);

    // Request 3 at T = 2200ms (< 5s)
    expect(shouldLogTap(cardId, clientIp, ua, 3200)).toBe(false);

    // Request 4 at T = 4500ms (< 5s)
    expect(shouldLogTap(cardId, clientIp, ua, 5500)).toBe(false);
  });

  it('allows subsequent tap after 5000ms window expires (TM-14)', () => {
    const cardId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const clientIp = '192.168.1.50';
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)';

    // Initial tap at T = 1000ms
    expect(shouldLogTap(cardId, clientIp, ua, 1000)).toBe(true);

    // Duplicate tap at T = 3000ms
    expect(shouldLogTap(cardId, clientIp, ua, 3000)).toBe(false);

    // Repeat tap at T = 6500ms (> 5000ms after initial tap)
    expect(shouldLogTap(cardId, clientIp, ua, 1000 + DEBOUNCE_WINDOW_MS + 500)).toBe(true);
  });

  it('does not debounce different cards or distinct IPs', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)';

    expect(shouldLogTap('card-1', '192.168.1.1', ua, 1000)).toBe(true);
    expect(shouldLogTap('card-2', '192.168.1.1', ua, 1200)).toBe(true);
    expect(shouldLogTap('card-1', '192.168.1.2', ua, 1300)).toBe(true);
  });

  it('hashes IP addresses consistently with SHA-256', () => {
    const hash1 = hashIp('203.0.113.195');
    const hash2 = hashIp('203.0.113.195');
    const hash3 = hashIp('203.0.113.196');

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hashIp('')).toBe('');
  });
});
