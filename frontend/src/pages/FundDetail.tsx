import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { download, getChart, getFund, getInvestors, money, shares } from '@/utils/fundApi';
import { DateFilter, TimeChart, type DateRange } from '@/components/FundCharts';
import { InvestorTable } from '@/components/InvestorTable';
import { HistoryTable } from '@/components/HistoryTable';
import { TradeDialog, type TradeKind } from '@/components/TradeDialog';
import { BackLink, Button, CopyNumber, ErrorState, Loading, Notice, PageHeader, Panel, WriteButton, WriteLink } from '@/components/ui';
export default function FundDetail(){
  const {id}=useParams(),fundId=Number(id);
  const [params,setParams]=useSearchParams(),[revision,setRevision]=useState(0),[trade,setTrade]=useState<{kind:TradeKind;id?:number}|null>(null),[message,setMessage]=useState(''),[exportError,setExportError]=useState(''),[exporting,setExporting]=useState(false);
  const [range,setRange]=useState<DateRange>({start:'',end:''}),[chartKind,setChartKind]=useState<'nav'|'balance'|'share'>('nav');
  const tab=params.get('view')||'overview';
  const fund=useRemote(signal=>getFund(fundId,signal),[fundId,revision]);
  const investors=useRemote(signal=>getInvestors(fundId,signal),[fundId,revision]);
  const chart=useRemote(signal=>{const query=new URLSearchParams();if(range.start)query.set('start_date',range.start);if(range.end)query.set('end_date',range.end);return getChart(fundId,query,signal);},[fundId,revision,range.start,range.end]);
  useDocumentTitle((fund.data?.name||'基金详情')+' · Compound Fund');
  if(fund.loading)return <Loading/>;if(fund.error||!fund.data)return <ErrorState error={fund.error||new Error('基金不存在')} retry={fund.reload}/>;
  const item=fund.data,people=investors.data||[];
  const exportFile=async()=>{setExporting(true);setExportError('');try{await download('/funds/'+fundId+'/operations/export','fund_'+fundId+'_operations.jsonl');}catch(e){setExportError(e instanceof Error?e.message:'导出失败');}finally{setExporting(false);}};
  return <><BackLink/><PageHeader title={item.name} eyebrow={'FUND / #'+item.id} description={'成立于 '+item.start_date+' · '+item.currency+(item.tags?' · '+item.tags.split(',').join(' / '):'')} actions={<><Button disabled={exporting} onClick={exportFile}>{exporting?'正在导出…':'导出完整记录'}</Button><Link to={'/funds/'+fundId+'/data'} className="button">导入与导出</Link><WriteLink to={'/funds/'+fundId+'/edit'}>编辑基金</WriteLink><WriteButton variant="primary" disabled={item.total_share<=0} title={item.total_share<=0?'请先添加投资者并申购':undefined} onClick={()=>setTrade({kind:'nav'})}>更新净值</WriteButton></>}/>
    {message&&<Notice tone="success">{message}</Notice>}{exportError&&<Notice tone="error">{exportError}</Notice>}
    <section className="panel metric-strip">{[{label:'基金总资产',value:money(item.balance,item.currency),raw:item.balance},{label:'单位净值',value:item.net_asset_value.toFixed(6),raw:item.net_asset_value},{label:'总份额',value:shares(item.total_share),raw:item.total_share},{label:'投资者',value:investors.loading?'加载中':String(people.length),raw:people.length}].map(stat=><div className="metric" key={stat.label}><div className="metric-label">{stat.label}</div><div className="metric-value"><CopyNumber value={stat.raw} display={stat.value}/></div><div className="metric-note">{stat.label==='单位净值'?'以当前账务记录为准':stat.label==='基金总资产'?item.currency+' 原币种':'当前基金'}</div></div>)}</section>
    <div className="tabs" role="tablist" aria-label="基金详情视图">{[['overview','概览'],['investors','投资者'],['history','操作历史']].map(([key,label])=><button key={key} type="button" role="tab" aria-selected={tab===key} className={'tab '+(tab===key?'active':'')} onClick={()=>setParams({view:key})}>{label}</button>)}</div>
    {tab==='overview'&&<Panel title="基金表现" caption="基于净值更新产生的真实历史快照" className="panel-pad" actions={<div className="segmented">{[['nav','净值'],['balance','总资产'],['share','份额']].map(([key,label])=><button type="button" key={key} className={chartKind===key?'active':''} onClick={()=>setChartKind(key as typeof chartKind)}>{label}</button>)}</div>}><DateFilter value={range} onChange={setRange}/>{chart.loading?<Loading/>:chart.error?<ErrorState error={chart.error} retry={chart.reload}/>:<TimeChart data={chart.data?.[chartKind]||[]} label={chartKind==='nav'?'单位净值':chartKind==='balance'?'总资产':'总份额'} unit={chartKind==='balance'?'money':chartKind} currency={item.currency}/>}<dl className="metadata-row"><div><dt>基金 ID</dt><dd>#{item.id}</dd></div><div><dt>创建日期</dt><dd>{item.created_at.slice(0,10)}</dd></div><div><dt>最近更新</dt><dd>{item.updated_at.slice(0,10)}</dd></div></dl></Panel>}
    {(tab==='overview'||tab==='investors')&&<><div className="section-heading"><h2>投资者明细</h2><Link className="text-link" to={'/funds/'+fundId+'/investors'}>独立投资者页面 →</Link></div><Panel>{investors.loading?<Loading/>:investors.error?<ErrorState error={investors.error} retry={investors.reload}/>:<InvestorTable fund={item} investors={people} onTrade={(kind,id)=>setTrade({kind,id})}/>}</Panel></>}
    {tab==='history'&&<Panel><HistoryTable fund={item} investors={people} revision={revision}/></Panel>}
    {trade&&<TradeDialog kind={trade.kind} investorId={trade.id} fund={item} investors={people} onClose={()=>setTrade(null)} onComplete={()=>{setRevision(n=>n+1);setMessage('操作已记录，基金、投资者和历史已刷新。');}}/>}
  </>;
}
