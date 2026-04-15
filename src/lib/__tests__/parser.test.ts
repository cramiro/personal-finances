import { describe, it, expect } from 'vitest';
import { parseExpense, formatAmount } from '@/lib/parser';
import { Category } from '@/types';

// ─── Fixture ──────────────────────────────────────────────────────────────────
// Subset of real DEFAULT_CATEGORIES with id/workspace_id added for tests
const CATS: Category[] = [
  { id: 'cat-super',    workspace_id: 'ws', name: 'Supermercado',    keywords: ['super','supermercado','mercado','chino','coto','carrefour','dia','jumbo'], icon: '🛒', color: '#1D9E75', is_default: true,  sort_order: 1 },
  { id: 'cat-trans',    workspace_id: 'ws', name: 'Transporte',      keywords: ['nafta','uber','taxi','sube','peaje','cabify','estacionamiento'],          icon: '🚗', color: '#378ADD', is_default: true,  sort_order: 2 },
  { id: 'cat-comida',   workspace_id: 'ws', name: 'Comida',          keywords: ['delivery','rappi','pedidosya','restaurant','resto','cafe','pizza','sushi','birra'], icon: '🍕', color: '#D85A30', is_default: true, sort_order: 3 },
  { id: 'cat-subs',     workspace_id: 'ws', name: 'Suscripciones',   keywords: ['netflix','spotify','youtube','hbo','disney','prime','icloud','chatgpt'],  icon: '📺', color: '#7F77DD', is_default: true,  sort_order: 4 },
  { id: 'cat-hogar',    workspace_id: 'ws', name: 'Hogar',           keywords: ['luz','gas','agua','internet','alquiler','expensas','limpieza'],           icon: '🏠', color: '#BA7517', is_default: true,  sort_order: 5 },
  { id: 'cat-otros',    workspace_id: 'ws', name: 'Otros',           keywords: [],                                                                         icon: '📦', color: '#888780', is_default: true,  sort_order: 10 },
];

// ─── parseExpense ─────────────────────────────────────────────────────────────
describe('parseExpense', () => {

  describe('empty / invalid input', () => {
    it('returns zero amount for empty string', () => {
      const r = parseExpense('', CATS, 'ARS');
      expect(r.amount).toBe(0);
      expect(r.currency).toBe('ARS');
      expect(r.description).toBe('');
    });

    it('returns zero amount for whitespace-only input', () => {
      const r = parseExpense('   ', CATS, 'ARS');
      expect(r.amount).toBe(0);
    });

    it('returns zero amount when there is no number', () => {
      const r = parseExpense('super', CATS, 'ARS');
      expect(r.amount).toBe(0);
    });
  });

  describe('amount parsing — ARS plain numbers', () => {
    it('parses a plain integer', () => {
      expect(parseExpense('1500 luz', CATS, 'ARS').amount).toBe(1500);
    });

    it('parses a plain decimal with dot', () => {
      expect(parseExpense('1500.5 luz', CATS, 'ARS').amount).toBe(1500.5);
    });

    it('parses a plain decimal with comma', () => {
      expect(parseExpense('1500,5 luz', CATS, 'ARS').amount).toBe(1500.5);
    });
  });

  describe('amount parsing — k suffix', () => {
    it('parses integer k', () => {
      expect(parseExpense('100k super', CATS, 'ARS').amount).toBe(100_000);
    });

    it('parses decimal k with dot', () => {
      expect(parseExpense('1.5k nafta', CATS, 'ARS').amount).toBe(1_500);
    });

    it('parses decimal k with comma', () => {
      expect(parseExpense('1,5k nafta', CATS, 'ARS').amount).toBe(1_500);
    });

    it('parses 25k', () => {
      expect(parseExpense('25k super', CATS, 'ARS').amount).toBe(25_000);
    });
  });

  describe('amount parsing — USD', () => {
    it('parses "50usd" — amount suffix', () => {
      const r = parseExpense('50usd netflix', CATS, 'ARS');
      expect(r.amount).toBe(50);
      expect(r.currency).toBe('USD');
    });

    it('parses "usd 200" — amount prefix', () => {
      const r = parseExpense('usd 200 spotify', CATS, 'ARS');
      expect(r.amount).toBe(200);
      expect(r.currency).toBe('USD');
    });

    it('sets currency USD even without category match', () => {
      const r = parseExpense('30usd algo', CATS, 'ARS');
      expect(r.currency).toBe('USD');
    });

    it('uses USD default currency when specified and no usd keyword', () => {
      const r = parseExpense('100 super', CATS, 'USD');
      expect(r.currency).toBe('USD');
    });
  });

  describe('category matching', () => {
    it('matches Supermercado via "super"', () => {
      const r = parseExpense('100k super', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-super');
      expect(r.categoryName).toBe('Supermercado');
    });

    it('matches Supermercado via "coto"', () => {
      const r = parseExpense('5000 coto', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-super');
    });

    it('matches Transporte via "nafta"', () => {
      const r = parseExpense('20k nafta', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-trans');
    });

    it('matches Transporte via "uber"', () => {
      const r = parseExpense('3000 uber', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-trans');
    });

    it('matches Suscripciones via "netflix"', () => {
      const r = parseExpense('50usd netflix', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-subs');
    });

    it('matches Suscripciones via "spotify"', () => {
      const r = parseExpense('usd 15 spotify', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-subs');
    });

    it('matches Hogar via "luz"', () => {
      const r = parseExpense('1500 luz', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-hogar');
    });

    it('matches Hogar via "expensas"', () => {
      const r = parseExpense('80k expensas', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-hogar');
    });

    it('matches Comida via "pizza"', () => {
      const r = parseExpense('8000 pizza', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-comida');
    });

    it('falls back to Otros for unknown words', () => {
      const r = parseExpense('999 algo raro', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-otros');
      expect(r.categoryName).toBe('Otros');
    });

    it('falls back to Otros for amount-only input', () => {
      const r = parseExpense('5000', CATS, 'ARS');
      expect(r.categoryName).toBe('Otros');
    });

    it('prefers category with more keyword matches when tied', () => {
      // "super mercado" — both "super" and "mercado" match Supermercado (2 hits),
      // so Supermercado should win over any single-hit category
      const r = parseExpense('10000 super mercado', CATS, 'ARS');
      expect(r.categoryId).toBe('cat-super');
    });
  });

  describe('description extraction', () => {
    it('uses remaining text after amount as description', () => {
      const r = parseExpense('100k super', CATS, 'ARS');
      expect(r.description).toBe('super');
    });

    it('uses full input as description when nothing remains after amount', () => {
      // "5000" — after extracting "5000", remaining = "" → falls back to full text
      const r = parseExpense('5000', CATS, 'ARS');
      expect(r.description).toBe('5000');
    });

    it('strips amount from description for USD', () => {
      const r = parseExpense('50usd netflix', CATS, 'ARS');
      expect(r.description).toBe('netflix');
    });
  });

  describe('category color', () => {
    it('returns matched category color', () => {
      const r = parseExpense('100k super', CATS, 'ARS');
      expect(r.categoryColor).toBe('#1D9E75');
    });

    it('returns fallback color for unmatched input', () => {
      const r = parseExpense('999 xyz', CATS, 'ARS');
      expect(r.categoryColor).toBe('#888780');
    });
  });
});

// ─── formatAmount ─────────────────────────────────────────────────────────────
describe('formatAmount', () => {

  it('formats ARS without decimals', () => {
    const result = formatAmount(1000, 'ARS');
    expect(result).toMatch(/^\$/);
    // es-AR uses '.' as thousands separator and ',' as decimal separator.
    // Math.round guarantees no decimal part, so the result must not contain ','
    expect(result).not.toContain(',');
  });

  it('rounds ARS to integer', () => {
    const result = formatAmount(1500.7, 'ARS');
    // Math.round(1500.7) = 1501
    expect(result).toContain('1.501');
  });

  it('formats USD with "USD" prefix', () => {
    const result = formatAmount(50, 'USD');
    expect(result).toMatch(/^USD /);
  });

  it('formats USD integer without unnecessary decimals', () => {
    expect(formatAmount(50, 'USD')).toBe('USD 50');
  });

  it('formats USD with up to 2 decimal places', () => {
    const result = formatAmount(1234.56, 'USD');
    expect(result).toMatch(/^USD /);
    expect(result).toContain('1.234'); // thousands separator in es-AR
  });

  it('formats zero ARS', () => {
    expect(formatAmount(0, 'ARS')).toBe('$0');
  });

  it('formats zero USD', () => {
    expect(formatAmount(0, 'USD')).toBe('USD 0');
  });

  it('formats large ARS amounts', () => {
    const result = formatAmount(1_000_000, 'ARS');
    expect(result).toMatch(/^\$/);
    expect(result).toContain('1.000.000');
  });
});
