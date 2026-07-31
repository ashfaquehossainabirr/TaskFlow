// Shared currency formatting helpers.
//
// Large dollar amounts (millions+) are rendered in compact form
// (e.g. $1.05B, $15.00T) so they never blow out a table column or a
// fixed-width stat box. The exact figure is always available via a
// tooltip using exactMoney().

export function formatMoney(value) {
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  }
  return num.toLocaleString();
}

export function exactMoney(value) {
  return `$${(Number(value) || 0).toLocaleString()}`;
}
