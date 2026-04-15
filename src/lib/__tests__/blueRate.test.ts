import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @/lib/supabase before importing blueRate (which imports supabase)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getBlueRate, getDailyRate } from '@/lib/blueRate';
import { supabase } from '@/lib/supabase';

// ─── localStorage mock (happy-dom v20 doesn't implement Storage.clear) ────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FRESH_RATE = { compra: 1300, venta: 1380, fetchedAt: new Date().toISOString() };
const STALE_RATE = { compra: 1200, venta: 1250, fetchedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() }; // 10 min ago

function mockFetchSuccess(compra: number, venta: number) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ compra, venta }),
  } as Response);
}

function mockFetchFailure() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: false,
  } as Response);
}

// ─── getBlueRate ──────────────────────────────────────────────────────────────
describe('getBlueRate', () => {

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns fresh cached value without fetching', async () => {
    localStorage.setItem('gastly_blue_rate', JSON.stringify(FRESH_RATE));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await getBlueRate();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.compra).toBe(FRESH_RATE.compra);
    expect(result.venta).toBe(FRESH_RATE.venta);
  });

  it('fetches from API when cache is stale (> 5 min)', async () => {
    localStorage.setItem('gastly_blue_rate', JSON.stringify(STALE_RATE));
    mockFetchSuccess(1400, 1450);

    const result = await getBlueRate();

    expect(globalThis.fetch).toHaveBeenCalledWith('https://dolarapi.com/v1/dolares/blue');
    expect(result.venta).toBe(1450);
  });

  it('fetches from API when no cache exists', async () => {
    mockFetchSuccess(1400, 1450);

    const result = await getBlueRate();

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    expect(result.compra).toBe(1400);
    expect(result.venta).toBe(1450);
  });

  it('stores fetched rate in localStorage cache', async () => {
    mockFetchSuccess(1400, 1450);

    await getBlueRate();

    const cached = JSON.parse(localStorage.getItem('gastly_blue_rate')!);
    expect(cached.venta).toBe(1450);
    expect(cached.fetchedAt).toBeDefined();
  });

  it('returns stale cache when API fails and stale cache exists', async () => {
    localStorage.setItem('gastly_blue_rate', JSON.stringify(STALE_RATE));
    mockFetchFailure();

    const result = await getBlueRate();

    expect(result.venta).toBe(STALE_RATE.venta);
  });

  it('returns hardcoded fallback (1400) when API fails and no cache exists', async () => {
    mockFetchFailure();

    const result = await getBlueRate();

    expect(result.compra).toBe(1400);
    expect(result.venta).toBe(1400);
  });

  it('returned rate has fetchedAt timestamp', async () => {
    mockFetchSuccess(1300, 1380);

    const result = await getBlueRate();

    expect(result.fetchedAt).toBeDefined();
    expect(new Date(result.fetchedAt).getTime()).not.toBeNaN();
  });
});

// ─── getDailyRate ─────────────────────────────────────────────────────────────
describe('getDailyRate', () => {

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.mocked(supabase.from).mockReset();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function mockSupabaseSelect(data: { blue_sell: number } | null) {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    } as any);
  }

  function mockSupabaseSelectThenUpsert(data: { blue_sell: number } | null) {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data }),
      upsert: upsertMock,
    } as any);
    return upsertMock;
  }

  it('returns stored rate when daily_rates has it', async () => {
    mockSupabaseSelect({ blue_sell: 1350 });

    const result = await getDailyRate('2026-04-14');

    expect(result).toBe(1350);
  });

  it('fetches from API and persists when rate is missing from DB', async () => {
    const upsertMock = mockSupabaseSelectThenUpsert(null);
    mockFetchSuccess(1300, 1400);

    const result = await getDailyRate('2026-04-14');

    expect(result).toBe(1400); // venta rate
    expect(upsertMock).toHaveBeenCalledWith(
      { date: '2026-04-14', blue_sell: 1400 },
      { onConflict: 'date' }
    );
  });

  it('returns a number (not string or null)', async () => {
    mockSupabaseSelect({ blue_sell: 1350 });

    const result = await getDailyRate('2026-01-01');

    expect(typeof result).toBe('number');
  });

  it('uses fallback 1400 when DB misses AND API fails', async () => {
    mockSupabaseSelectThenUpsert(null);
    mockFetchFailure();

    const result = await getDailyRate('2026-04-14');

    expect(result).toBe(1400);
  });
});
