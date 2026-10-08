import { describe, it, expect, beforeEach } from 'vitest';
import { getCardBySlug, resetMockStore, getMockStore } from '@/lib/db';
import { handleTapTelemetry } from '@/lib/logger';
import { resetDebounceCache } from '@/lib/debounce';

describe('Card Route Logic & Shield Mode vs Direct Mode', () => {
  beforeEach(() => {
    resetMockStore();
    resetDebounceCache();
  });

  it('retrieves active Shield Mode card (demo-card)', async () => {
    const card = await getCardBySlug('demo-card');
    expect(card).not.toBeNull();
    expect(card.slug).toBe('demo-card');
    expect(card.is_shield_active).toBe(true);
    expect(card.store_name).toBe('Kopi Senja Utama');
  });

  it('retrieves Direct Mode card (direct-card) with is_shield_active: false (TM-06)', async () => {
    const card = await getCardBySlug('direct-card');
    expect(card).not.toBeNull();
    expect(card.slug).toBe('direct-card');
    expect(card.is_shield_active).toBe(false);
    expect(card.google_review_url).toBe('https://maps.app.goo.gl/direct-review');
  });

  it('returns null for nonexistent slug (TM-07 fallback condition)', async () => {
    const card = await getCardBySlug('nonexistent-slug');
    expect(card).toBeNull();
  });

  it('handles telemetry asynchronously when card is tapped (TM-12)', async () => {
    const card = await getCardBySlug('demo-card');
    const result = handleTapTelemetry({
      cardId: card.id,
      clientIp: '203.0.113.10',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    expect(result).toBe(true);

    // Wait a brief tick for async fire-and-forget execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    const store = getMockStore();
    expect(store.tapLogs).toHaveLength(1);
    expect(store.tapLogs[0].card_id).toBe(card.id);
    expect(store.tapLogs[0].device_os).toBe('iOS');
  });

  it('suppresses duplicate telemetry within 5 seconds', async () => {
    const card = await getCardBySlug('demo-card');

    const first = handleTapTelemetry({
      cardId: card.id,
      clientIp: '203.0.113.10',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    expect(first).toBe(true);

    const second = handleTapTelemetry({
      cardId: card.id,
      clientIp: '203.0.113.10',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    expect(second).toBe(false); // Suppressed by debounce
  });
});
