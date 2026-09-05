import { useFundStore } from '@/stores/fund';
import { operationLabels } from '@/components/HistoryTable';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getChart, getFunds, money } from '@/utils/fundApi';
import { EXISTING_USD_CNY_ESTIMATE } from '@/utils/fundFormatting';
import { DateFilter, TimeChart, type DateRange } from '@/components/FundCharts';
import { FundTable } from '@/components/FundTable';
import { Empty, ErrorState, Loading, PageHeader, Panel, WriteButton, WriteLink } from '@/components/ui';

export default function Dashboard(){
  useDocumentTitle('基金总览 · Compound Fund');
  const [currency,setCurrency]=useState<'CNY'|'USD'>('CNY'),[tag,setTag]=useState('');
  const [range,setRange]=useState<DateRange>({start:'',end:''});
  const funds=useRemote(getFunds,[]);
  const recent=useRemote(()=>useFundStore.getState().fetchRecentOperations(10),[]);
  const chart=useRemote(signal=>{const query=new URLSearchParams();if(tag)query.set('tag',tag);if(range.start)query.set('start_date',range.start);if(range.end)query.set('end_date',range.end);return getChart(null,query,signal);},[tag,range.start,range.end]);
  const all=funds.data||[],tags=[...new Set(all.flatMap(f=>f.tags?.split(',').map(t=>t.trim()).filter(Boolean)||[]))];
  const filtered=all.filter(f=>!tag||f.tags?.includes(tag));
  const shown=filtered.filter(f=>f.currency===currency);
  const cny=filtered.filter(f=>f.currency==='CNY').reduce((sum,f)=>sum+f.balance,0),usd=filtered.filter(f=>f.currency==='USD').reduce((sum,f)=>sum+f.balance,0);
  const estimated=cny+usd*EXISTING_USD_CNY_ESTIMATE;
  const distribution=useMemo(()=>shown.filter(f=>f.balance>0).map(f=>({name:f.name,value:f.balance})),[funds.data,currency,tag]);
  const total=shown.reduce((sum,f)=>sum+f.balance,0),colors=['#3567d8','#6f92da','#a2b9e5','#c8d5ed','#8399b9'];
  return <><PageHeader title="基金总览" description="从全局资金到每一笔记录，看清长期积累。" actions={<WriteLink to="/funds/create" variant="primary">＋ 新建基金</WriteLink>}/>
    {funds.loading?<Loading/>:funds.error?<ErrorState error={funds.error} retry={funds.reload}/>:<>
      <div className="overview-filters"><div className="segmented" aria-label="基金币种">{(['CNY','USD'] as const).map(c=><button key={c} type="button" className={currency===c?'active':''} aria-pressed={currency===c} onClick={()=>setCurrency(c)}>{c==='CNY'?'人民币 CNY':'美元 USD'}</button>)}</div><select aria-label="按标签筛选基金" value={tag} onChange={e=>setTag(e.target.value)}><option value="">全部标签</option>{tags.map(t=><option key={t}>{t}</option>)}</select></div>
      <section className="panel metric-strip">{[{label:'人民币资产',value:money(cny,'CNY'),note:'原币种统计，不自动换汇'},{label:'美元资产',value:money(usd,'USD'),note:'原币种统计，不自动换汇'},{label:'在管基金',value:String(filtered.length),note:shown.length+' 只 '+currency+' 基金'},{label:'投资者记录',value:String(filtered.reduce((sum,f)=>sum+(f.investor_count||0),0)),note:'按基金统计，非跨基金去重人数'}].map(item=><div className="metric" key={item.label}><div className="metric-label">{item.label}</div><div className="metric-value">{item.value}</div><div className="metric-note">{item.note}</div></div>)}</section>
      <div className="split-chart"><Panel title="资产趋势" caption="跨币种估算视图，沿用现有汇总口径" className="panel-pad"><DateFilter value={range} onChange={setRange}/>{chart.loading?<Loading/>:chart.error?<ErrorState error={chart.error} retry={chart.reload}/>:<TimeChart data={(currency==='USD'?chart.data?.balance_usd:chart.data?.balance)||[]} label="总资产估算" currency={currency}/>}<details className="method-note"><summary>查看汇总口径</summary><p>此曲线仍使用原有固定汇率 1 USD = {EXISTING_USD_CNY_ESTIMATE} CNY，非实时汇率。人民币估算 {money(estimated,'CNY')}；美元估算 {money(estimated/EXISTING_USD_CNY_ESTIMATE,'USD')}。上方资产卡片按原币种分别统计。</p></details></Panel>
      <Panel title="资产分布" caption={currency+' · 仅比较同币种资产'} className="panel-pad">{distribution.length?<><div className="allocation-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={56} outerRadius={77} paddingAngle={3} stroke="none" isAnimationActive={false}>{distribution.map((d,i)=><Cell key={d.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={(value:number)=>money(value,currency)}/></PieChart></ResponsiveContainer><span className="allocation-center"><strong>{shown.length}</strong><small>在管基金</small></span></div><div className="allocation-list">{distribution.map((d,i)=><div className="allocation-row" key={d.name}><i style={{background:colors[i%colors.length]}}/><span>{d.name}</span><strong>{total>0?(d.value/total*100).toFixed(1):'0.0'}%</strong></div>)}</div></>:<Empty title="当前币种暂无资产"/>}</Panel></div>
      <div className="section-heading"><h2>我的基金 <span className="muted">{currency}</span></h2><Link className="text-link" to="/funds">管理全部基金 →</Link></div><Panel><FundTable funds={shown}/></Panel>
      <Panel title="最近操作" caption="所有基金最近 10 笔真实记录" className="section-gap" actions={<Link className="text-link" to="/operations">查看全部 →</Link>}>{recent.loading?<Loading/>:recent.error?<ErrorState error={recent.error} retry={recent.reload}/>:!recent.data?.length?<Empty title="暂无操作记录"/>:<div className="table-wrap"><table><thead><tr><th>记账日期</th><th>基金</th><th>操作</th><th>投资者</th><th className="number">金额</th></tr></thead><tbody>{recent.data.map(op=>{const fund=all.find(f=>f.id===op.fund_id);return <tr key={op.id}><td>{op.operation_date}</td><td><Link className="text-link" to={'/funds/'+op.fund_id+'?view=history'}>{fund?.name||'基金 #'+op.fund_id}</Link></td><td><span className="badge">{operationLabels[op.operation_type]||op.operation_type}</span></td><td>{op.investor_name||'基金整体'}</td><td className="number">{op.amount==null?'--':fund?money(op.amount,fund.currency):String(op.amount)}</td></tr>;})}</tbody></table></div>}</Panel>
    </>}
  </>;
}
