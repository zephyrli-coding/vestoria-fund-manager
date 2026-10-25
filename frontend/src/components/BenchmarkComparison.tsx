import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRemote } from '@/hooks/useRemote';
import { useAuthStore } from '@/stores/auth';
import { request } from '@/utils/request';
import type { ApiResponse } from '@/types/api';
import type { DateRange } from './FundCharts';
import { Button, ErrorState, Loading, Notice } from './ui';
import './BenchmarkComparison.css';

const options = [
  { id: 'sp500', name: '标普 500', color: '#bd7614' },
  { id: 'btc', name: 'BTC / USDT', color: '#8a53b3' },
  { id: 'sse_composite', name: '上证指数', color: '#167f72' },
  { id: 'nasdaq100', name: '纳斯达克 100', color: '#c15068' },
  { id: 'gold', name: '黄金期货', color: '#ad951b' },
];
type Point = { date: string; value: number | null; source_date: string | null; fx_date: string | null };
type Series = { id: string; name: string; asset_id: string; currency: string; source: string; return_type: string;
  status: string; warning: string | null; total_return: number | null; excess_pp: number | null; points: Point[] };
type Comparison = { effective_range: DateRange | null; fund_return: number | null;
  fund_points: { date: string; value: number; normalized: number }[]; series: Series[]; warning: string | null;
  data_status?: { cached: boolean; checked_at: number; warning: string | null }; fx_status?: { warning: string | null } | null };
type ChartRow = { ts: number; date: string; fund: number | null; [key: string]: number | string | null };
const returnLabels: Record<string, string> = { price_index: '价格指数', spot_price: '现货价格', futures_price: '期货连续合约报价' };
const percent = (value: number | null) => value == null ? '—' : `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const pointValue = (value: number | null, mode: string) => value == null ? '—' : mode === 'return' ? percent(value - 1) : value.toFixed(4);
const dataBase = (import.meta.env.VITE_DATA_TERMINAL_URL || 'https://vestoria.mr-strawberry.com/data').replace(/\/$/, '');

function saved(key: string): { ids?: string[]; mode?: string; display?: string } {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return { ids: Array.isArray(value.ids) ? value.ids.filter((id: unknown) => typeof id === 'string') : [],
      mode: value.mode, display: value.display };
  } catch { return {}; }
}

export function BenchmarkComparison({ fundId, currency, range, revision, children }: {
  fundId: number; currency: string; range: DateRange; revision: number; children: ReactNode;
}) {
  const userId = useAuthStore(state => state.user?.id);
  const storageKey = `fund-benchmarks:v1:${userId}:${fundId}`;
  const [params, setParams] = useSearchParams();
  const [ids, setIds] = useState<string[]>(() => {
    const source = params.has('benchmarks') ? (params.get('benchmarks') || '').split(',') : saved(storageKey).ids || [];
    return options.filter(option => source.includes(option.id)).map(option => option.id);
  });
  const [mode, setMode] = useState(() => (params.get('benchmark_currency') || saved(storageKey).mode) === 'fund' ? 'fund' : 'native');
  const [display, setDisplay] = useState(() => (params.get('benchmark_display') || saved(storageKey).display) === 'return' ? 'return' : 'nav');
  const selected = ids.join(',');
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ ids, mode, display })); } catch { /* browser storage may be disabled */ }
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('benchmarks', selected);
      next.set('benchmark_currency', mode);
      next.set('benchmark_display', display);
      return next;
    }, { replace: true });
  }, [selected, mode, display, storageKey]);
  const remote = useRemote(async signal => {
    if (!selected) return null;
    const query = new URLSearchParams({ ids: selected, currency_mode: mode });
    if (range.start) query.set('start_date', range.start);
    if (range.end) query.set('end_date', range.end);
    return (await request<ApiResponse<Comparison>>(`/funds/${fundId}/benchmark-comparison?${query}`, { signal })).data;
  }, [fundId, selected, mode, range.start, range.end, revision]);
  const result = remote.data;
  const plotted = result?.series.filter(series => series.points.length) || [];
  const rows = useMemo(() => {
    const byDate = new Map<string, ChartRow>();
    const row = (day: string) => {
      if (!byDate.has(day)) byDate.set(day, { ts: Date.parse(day + 'T00:00:00Z'), date: day, fund: null });
      return byDate.get(day)!;
    };
    result?.fund_points.forEach(point => { row(point.date).fund = display === 'return' ? (point.normalized - 1) * 100 : point.normalized; });
    result?.series.forEach(series => series.points.forEach(point => {
      row(point.date)[series.id] = point.value == null ? null : display === 'return' ? (point.value - 1) * 100 : point.value;
    }));
    return [...byDate.values()].sort((a, b) => a.ts - b.ts);
  }, [result, display]);
  const toggle = (id: string) => setIds(previous => options.filter(option => option.id === id ? !previous.includes(id) : previous.includes(option.id)).map(option => option.id));

  return <div className="benchmark-section">
    <div className="benchmark-selector" role="group" aria-label="净值对比基准">
      <span className="benchmark-label">对比基准</span>
      {options.map(option => <button key={option.id} type="button" className={'benchmark-chip ' + (ids.includes(option.id) ? 'selected' : '')}
        aria-pressed={ids.includes(option.id)} onClick={() => toggle(option.id)}><span style={{ background: option.color }} />{option.name}</button>)}
      {!!ids.length && <Button variant="ghost" className="small-button" onClick={() => setIds([])}>原始净值</Button>}
    </div>
    {!ids.length ? children : <>
      <div className="benchmark-toolbar">
        <div className="segmented" aria-label="对比图显示方式">
          <button type="button" aria-pressed={display === 'nav'} onClick={() => setDisplay('nav')}>起点 = 1</button>
          <button type="button" aria-pressed={display === 'return'} onClick={() => setDisplay('return')}>累计收益 %</button>
        </div>
        <label>币种口径 <select aria-label="基准币种口径" value={mode} onChange={event => setMode(event.target.value)}>
          <option value="native">各自原币</option><option value="fund">按基金币种 · {currency}</option>
        </select></label>
      </div>
      <p className="footnote">区间起点归一为 1，原始净值不变。{mode === 'native' ? '各自原币收益，不包含跨币种汇率变动；BTC 以 USDT 计价。' : `按 ${currency} 及历史参考汇率换算；USDT 无换算数据时单独提示。`}</p>
      {remote.loading ? <Loading label="正在读取基准行情与基金净值…" /> : remote.error ? <><ErrorState error={remote.error} retry={remote.reload} />{children}</> : result && <>
        {result.warning && <Notice tone="warning">{result.warning}</Notice>}
        {result.data_status?.warning && <Notice tone="warning">{result.data_status.warning}</Notice>}
        {result.fx_status?.warning && <Notice tone="warning">{result.fx_status.warning}</Notice>}
        {result.effective_range ? <>
          <div className="benchmark-range">共同有效区间 <strong>{result.effective_range.start} — {result.effective_range.end}</strong>
            <span>{result.fund_points.length} 个真实基金净值点</span></div>
          <div className="benchmark-legend"><span><i style={{ background: '#3567d8' }} />基金</span>{plotted.map(series =>
            <span key={series.id}><i style={{ background: options.find(o => o.id === series.id)?.color }} />{series.name}</span>)}</div>
          <div className="chart-box benchmark-chart" role="img" aria-label="基金与基准归一化对比，连续日期轴；下方提供真实数据表">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 15, left: 0, bottom: 8 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="#e9ecf1" strokeDasharray="3 4" />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} minTickGap={40}
                tick={{ fontSize: 11 }} tickFormatter={value => new Date(value).toISOString().slice(0, 10)} />
              <YAxis width={64} domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={value => display === 'return' ? `${Number(value).toFixed(0)}%` : Number(value).toFixed(2)} />
              <Tooltip filterNull={false} content={({ active, label }) => {
                if (!active || label == null) return null;
                const day = new Date(Number(label)).toISOString().slice(0, 10);
                const fund = result.fund_points.find(point => point.date === day);
                return <div className="benchmark-tooltip"><strong>{day}</strong><div>基金：{fund ? pointValue(fund.normalized, display) : '未记录净值'}</div>
                  {plotted.map(series => { const point = series.points.find(p => p.date === day); return <div key={series.id}>{series.name}：{pointValue(point?.value ?? null, display)}
                    <small>报价 {point?.source_date || '缺失'}{point?.fx_date ? ` · 汇率 ${point.fx_date}` : ''}</small></div>; })}</div>;
              }} />
              {plotted.map(series => <Line key={series.id} dataKey={series.id} name={series.name} type="linear" stroke={options.find(o => o.id === series.id)?.color}
                dot={false} strokeWidth={1.7} connectNulls={false} isAnimationActive={false} />)}
              <Line dataKey="fund" name="基金" type="linear" stroke="#3567d8" strokeWidth={2.6} connectNulls dot={{ r: 2.5 }} activeDot={{ r: 4 }} isAnimationActive={false} />
            </LineChart></ResponsiveContainer>
          </div>
          <p className="footnote">基金圆点为真实记录，连线仅辅助阅读，未补造每日净值。各市场日收盘口径，非同一瞬间估值；股票指数不含分红再投资。{ids.includes('gold') && '黄金为 GC=F 美元计价期货连续合约报价，含换月影响，不代表持仓总收益。'}</p>
          <div className="table-wrap benchmark-summary"><table><thead><tr><th>对比对象</th><th>区间收益</th><th>基金收益差</th><th>数据口径</th></tr></thead>
            <tbody><tr><td><strong>基金</strong></td><td>{percent(result.fund_return)}</td><td>—</td><td>{currency} 账务净值</td></tr>
              {result.series.map(series => <tr key={series.id}><td><a target="_blank" rel="noreferrer" href={`${dataBase}/assets/${encodeURIComponent(series.asset_id)}`}>{series.name} ↗</a></td>
                <td>{percent(series.total_return)}</td><td>{series.excess_pp == null ? '—' : `${series.excess_pp > 0 ? '+' : ''}${series.excess_pp.toFixed(2)} 个百分点`}</td>
                <td className="wrap-cell">{series.warning || `${series.source} · ${series.currency} · ${returnLabels[series.return_type] || series.return_type}`}</td></tr>)}</tbody></table></div>
          <details className="chart-data"><summary>查看对比数据（{rows.length} 个日期）</summary><div className="table-wrap chart-data-table"><table><thead><tr><th>日期</th><th>基金</th>{plotted.map(series => <th key={series.id}>{series.name}</th>)}</tr></thead><tbody>
            {rows.map(row => <tr key={row.date}><td>{row.date}</td><td>{row.fund == null ? '未记录' : display === 'return' ? `${row.fund.toFixed(2)}%` : row.fund.toFixed(4)}</td>
              {plotted.map(series => <td key={series.id}>{row[series.id] == null ? '缺失' : `${Number(row[series.id]).toFixed(display === 'return' ? 2 : 4)}${display === 'return' ? '%' : ''}`}</td>)}</tr>)}
          </tbody></table></div></details>
        </> : <>{result.series.map(series => series.warning && <Notice key={series.id} tone="warning">{series.name}：{series.warning}</Notice>)}{children}</>}
      </>}
    </>}
  </div>;
}
