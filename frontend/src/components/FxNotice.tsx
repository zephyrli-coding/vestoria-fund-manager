import type { FxStatus } from '@/utils/fundApi';
import { Notice } from '@/components/ui';
export function FxNotice({fx}:{fx?:FxStatus}) {
  if (!fx) return <p className="footnote">正在读取参考汇率…</p>;
  return <div className="fx-status" role="status">{fx.latest && <p className="footnote">估算汇率 1 USD = {Number(fx.latest.rate).toFixed(4)} CNY · {fx.latest.source} · {fx.latest.rate_date} · 每日参考汇率，仅用于展示估值</p>}
    {fx.warning && <Notice tone="warning">{fx.warning}。{fx.cached ? '当前使用最近成功缓存，请留意汇率日期。' : fx.available ? '当前显示已获取的参考汇率，请留意提示与汇率日期。' : '缺少汇率时不计算跨币种总额，原币账务仍可查看。'}</Notice>}
  </div>;
}
