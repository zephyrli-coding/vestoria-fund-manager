export type AmountDigits = 0 | 2;
const amountFormatters = {
  0: new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  2: new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

export const formatAmount = (value: number, digits: AmountDigits = 2): string =>
  Number.isFinite(value) ? amountFormatters[digits].format(value) : '--';

export const formatNav = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(5) : '--';

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
