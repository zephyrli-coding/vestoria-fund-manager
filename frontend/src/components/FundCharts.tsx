import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { localDate } from '@/utils/fundFormatting';
import { money } from '@/utils/fundApi';
import { Empty } from '@/components/ui';

export interface DateRange { start: string; end: string; }
export function DateFilter({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) {
  const selectPeriod = (months: number | 'year' | 'all') => {
    const end = new Date(), start = new Date();
    if (months === 'year') start.setMonth(0, 1);
    else if (typeof months === 'number') start.setMonth(start.getMonth() - months);
    onChange({start: months === 'all' ? '' : localDate(start), end: months === 'all' ? '' : localDate(end)});
  };
  return <div className="date-filter"><div className="segmented" aria-label="图表时间范围">{[[1,'1M'],[3,'3M'],[6,'6M'],['year','今年'],['all','全部']].map(([value, label]) => <button type="button" key={label} onClick={() => selectPeriod(value as number | 'year' | 'all')}>{label}</button>)}</div><div className="date-inputs"><label><span className="sr-only">开始日期</span><input aria-label="开始日期" type="date" value={value.start} max={value.end || undefined} onChange={e => onChange({...value, start:e.target.value})} /></label><span>至</span><label><span className="sr-only">结束日期</span><input aria-label="结束日期" type="date" value={value.end} min={value.start || undefined} onChange={e => onChange({...value, end:e.target.value})} /></label></div></div>;
}
export function TimeChart({ data, label, currency = 'CNY', unit = 'money' }: { data: {date:string;value:number}[]; label:string; currency?: string; unit?: 'money' | 'nav' | 'share' }) {
  const format = (value: number) => unit === 'nav' ? value.toFixed(6) : unit === 'share' ? value.toLocaleString('zh-CN', {maximumFractionDigits:6}) : money(value, currency);
  if (!data.length) return <Empty title="所选日期暂无历史快照" description="净值更新会生成真实快照；暂无记录时不会绘制模拟曲线。" />;
  const values = data.map(point => point.value), min = Math.min(...values), max = Math.max(...values);
  const padding = Math.max((max - min) * 0.08, Math.abs(max) * 0.015, unit === 'nav' ? 0.0001 : 0.01);
  return <div className="chart-section"><div className="chart-box" role="img" aria-label={label + '，' + data.length + ' 个真实历史记录；下方可展开数据表。'}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:12,right:18,left:0,bottom:8}} accessibilityLayer><CartesianGrid vertical={false} stroke="#e9ecf1" strokeDasharray="3 4" /><XAxis dataKey="date" tick={{fontSize:11,fill:'#7b8391'}} tickLine={false} axisLine={false} minTickGap={35} tickFormatter={date => date.slice(5).replace('-','/')} /><YAxis width={72} domain={[min-padding,max+padding]} tick={{fontSize:10,fill:'#7b8391'}} tickLine={false} axisLine={false} tickFormatter={value => unit === 'nav' ? value.toFixed(3) : Math.abs(value) >= 10000 ? (value/10000).toFixed(1)+'万' : value.toLocaleString('zh-CN',{maximumFractionDigits:1})} /><Tooltip contentStyle={{border:'1px solid #e9ecf1',borderRadius:8,fontSize:12}} formatter={(value:number) => [format(value),label]} /><Line type="linear" dataKey="value" name={label} stroke="#3567d8" strokeWidth={2} dot={data.length <= 2 ? {r:3} : false} activeDot={{r:4}} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><details className="chart-data"><summary>查看曲线数据（{data.length} 条）</summary><div className="table-wrap chart-data-table"><table><thead><tr><th>日期</th><th className="number">{label}</th></tr></thead><tbody>{data.map((point,index) => <tr key={point.date+'-'+index}><td>{point.date}</td><td className="number">{format(point.value)}</td></tr>)}</tbody></table></div></details></div>;
}
