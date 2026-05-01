export const CAT_COLORS = [
  '#1D9E75', '#378ADD', '#D85A30', '#7F77DD', '#BA7517',
  '#D4537E', '#E24B4A', '#639922', '#534AB7', '#888780',
];

const AR_TZ = 'America/Argentina/Buenos_Aires';

/** Current date in Argentina timezone as "YYYY-MM-DD" */
export function arDate(d: Date = new Date()): string {
  return d.toLocaleDateString('sv-SE', { timeZone: AR_TZ });
}

/** Current year-month in Argentina timezone as "YYYY-MM" */
export function arYearMonth(d: Date = new Date()): string {
  return arDate(d).slice(0, 7);
}
