/** GBP (£) using en-GB for a consistent pound symbol everywhere. */
export function formatGbp(amount: number, fractionDigits: 0 | 2 = 2): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Compact £ for large values (e.g. watch list prices). */
export function formatGbpCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: 'compact',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('K', 'k');
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount);
}
