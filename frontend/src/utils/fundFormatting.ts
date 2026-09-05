// Existing estimate only; this is not a live exchange rate.
export const EXISTING_USD_CNY_ESTIMATE = 6.9;

const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatAmount = (value: number): string =>
  Number.isFinite(value) ? moneyFormatter.format(value) : '--';

export function localDate(value = new Date()): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

const roundShares = (value: number) => Math.round(value * 1e6) / 1e6;

export function previewMovement(
  heldShares: number, nav: number, amount: number, amountType: 'share' | 'balance'
) {
  if (![heldShares, nav, amount].every(Number.isFinite) || nav <= 0 || amount <= 0) return null;
  const available = amountType === 'share' ? heldShares : heldShares * nav;
  const actual = Math.min(amount, available);
  const shares = roundShares(amountType === 'share' ? actual : actual / nav);
  return {
    shares,
    balance: amountType === 'share' ? roundShares(shares * nav) : actual,
    remainingShares: roundShares(heldShares - shares),
    capped: amount > available,
  };
}
