import { Category, Currency, ParsedExpense } from '@/types';

export function parseExpense(input: string, categories: Category[], defaultCurrency: Currency): ParsedExpense {
  const text = input.trim().toLowerCase();
  if (!text) return { amount: 0, currency: defaultCurrency, description: '', categoryId: null, categoryName: 'Otros', categoryColor: '#888780' };

  let amount = 0;
  let currency: Currency = defaultCurrency;
  let remaining = text;

  const usdPattern = /(\d+(?:[.,]\d+)?)\s*usd|usd\s*(\d+(?:[.,]\d+)?)/i;
  const usdMatch = text.match(usdPattern);
  if (usdMatch) {
    currency = 'USD';
    amount = parseFloat((usdMatch[1] ?? usdMatch[2]).replace(',', '.'));
    remaining = text.replace(usdMatch[0], '').trim();
  } else {
    const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
    if (kMatch) {
      amount = parseFloat(kMatch[1].replace(',', '.')) * 1000;
      remaining = text.replace(kMatch[0], '').trim();
    } else {
      const numMatch = text.match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        amount = parseFloat(numMatch[1].replace(',', '.'));
        remaining = text.replace(numMatch[0], '').trim();
      }
    }
  }

  const words = remaining.split(/\s+/).filter(Boolean);
  let matched: Category | undefined;
  let bestScore = 0;
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      for (const word of words) {
        if (word.includes(kw) || kw.includes(word)) {
          if (kw.length > bestScore) { bestScore = kw.length; matched = cat; }
        }
      }
    }
  }

  const otros = categories.find(c => c.name === 'Otros');
  return {
    amount,
    currency,
    description: remaining || text,
    categoryId: matched?.id ?? otros?.id ?? null,
    categoryName: matched?.name ?? 'Otros',
    categoryColor: matched?.color ?? '#888780',
  };
}

export function formatAmount(amount: number, currency: Currency): string {
  if (currency === 'USD') return `USD ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}
