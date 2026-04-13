import { BlueRate } from '@/types';

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
