import { BlueRate } from '@/types';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'gastly_blue_rate';
const FALLBACK = 1400;

export async function getBlueRate(): Promise<BlueRate> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('api error');
    const json = await res.json();
    const rate: BlueRate = { compra: json.compra, venta: json.venta, fetchedAt: new Date().toISOString() };
    if (typeof window !== 'undefined') localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
    return rate;
  } catch {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    }
    return { compra: FALLBACK, venta: FALLBACK, fetchedAt: new Date().toISOString() };
  }
}

// Returns the blue sell rate for a given date (YYYY-MM-DD).
// Checks daily_rates table first; if missing, fetches from API and persists it.
export async function getDailyRate(dateStr: string): Promise<number> {
  const { data } = await supabase
    .from('daily_rates')
    .select('blue_sell')
    .eq('date', dateStr)
    .maybeSingle();

  if (data) return Number(data.blue_sell);

  const rate = await getBlueRate();
  const sell = rate.venta;

  await supabase
    .from('daily_rates')
    .upsert({ date: dateStr, blue_sell: sell }, { onConflict: 'date' });

  return sell;
}
