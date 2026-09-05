import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getFund, getInvestor, getInvestors, getReturns, investorReturn, money, shares } from '@/utils/fundApi';
import { DateFilter, TimeChart, type DateRange } from '@/components/FundCharts';
import { HistoryTable } from '@/components/HistoryTable';
import { TradeDialog, type TradeKind } from '@/components/TradeDialog';
import { BackLink, ErrorState, Loading, Notice, PageHeader, Panel, WriteButton } from '@/components/ui';
export default function InvestorDetail(){
  const {id,investorId}=useParams(),fundId=Number(id),personId=Number(investorId);
  const [revision,setRevision]=useState(0),[trade,setTrade]=useState<TradeKind|null>(null),[range,setRange]=useState<DateRange>({start:'',end:''}),[saved,setSaved]=useState(false);
  const fund=useRemote(signal=>getFund(fundId,signal),[fundId,revision]),person=useRemote(signal=>getInvestor(fundId,personId,signal),[fundId,personId,revision]),returns=useRemote(signal=>getReturns(fundId,personId,signal),[fundId,personId,revision]),people=useRemote(signal=>getInvestors(fundId,signal),[fundId,revision]);
  useDocumentTitle((person.data?.name||'投资者详情')+' · Compound Fund');
  if(fund.loading||person.loading)return <Loading/>;if(fund.error||person.error||!fund.data||!person.data)return <ErrorState error={fund.error||person.error||new Error('投资者不存在')} retry={()=>{fund.reload();person.reload();}}/>;
  const f=fund.data,p=person.data,profit=investorReturn(p,f),rate=p.total_invested>0?profit/p.total_invested*100:0,latest=returns.data?.[returns.data.length-1];
  const curve=(returns.data||[]).filter(point=>(!range.start||point.date>=range.start)&&(!range.end||point.date<=range.end)).map(point=>({date:point.date,value:point.total_return}));
  return <><BackLink to={'/funds/'+fundId+'/investors'}>返回投资者列表</BackLink><PageHeader title={p.name} eyebrow={'INVESTOR / #'+p.id} description={f.name+' · '+f.currency+' · 加入于 '+(p.creation_date||p.created_at).slice(0,10)} actions={<><WriteButton onClick={()=>setTrade('invest')}>申购</WriteButton><WriteButton disabled={p.share<=0} onClick={()=>setTrade('redeem')}>赎回</WriteButton><WriteButton variant="primary" disabled={p.share<=0||!people.data||people.data.length<2} onClick={()=>setTrade('transfer')}>份额转让</WriteButton></>}/>{saved&&<Notice tone="success">操作已记录，持仓与历史已刷新。</Notice>}
    <section className="panel metric-strip">{[{label:'当前资产',value:money(p.balance,f.currency)},{label:'持有份额',value:shares(p.share)},{label:'累计收益',value:money(profit,f.currency,true),signed:true},{label:'收益率',value:(rate>=0?'+':'')+rate.toFixed(2)+'%',signed:true}].map(stat=><div className="metric" key={stat.label}><div className="metric-label">{stat.label}</div><div className={'metric-value '+(stat.signed?(profit>=0?'positive':'negative'):'')}>{stat.value}</div><div className="metric-note">{stat.label==='收益率'?'累计收益 / 累计投入，非年化':'当前基金记账口径'}</div></div>)}</section>
    <Panel title="收益曲线" caption="净值更新时生成的投资者收益快照" className="panel-pad"><DateFilter value={range} onChange={setRange}/>{returns.loading?<Loading/>:returns.error?<ErrorState error={returns.error} retry={returns.reload}/>:<TimeChart data={curve} label="累计收益" currency={f.currency}/>}</Panel>
    <div className="two-column section-gap"><Panel title="投入、赎回与收益口径" className="panel-pad"><dl className="definition-list"><dt>累计投入（含转入）</dt><dd>{money(p.total_invested,f.currency)}</dd><dt>累计赎回（含转出）</dt><dd>{money(p.total_redeemed,f.currency)}</dd><dt>当前持仓估值</dt><dd>{shares(p.share)} × {f.net_asset_value.toFixed(6)}</dd><dt>累计收益</dt><dd className={profit>=0?'positive':'negative'}>{money(profit,f.currency,true)}</dd></dl><p className="footnote">累计收益 = 当前份额 × 当前净值 + 累计赎回 − 累计投入。收益率不是年化、TWR 或 XIRR。</p></Panel><Panel title="最新快照" className="panel-pad">{latest?<dl className="definition-list"><dt>日期</dt><dd>{latest.date}</dd><dt>当时净值</dt><dd>{latest.nav.toFixed(6)}</dd><dt>当时份额</dt><dd>{shares(latest.share)}</dd><dt>当时累计收益</dt><dd>{money(latest.total_return,f.currency,true)}</dd></dl>:<p className="muted">暂无快照；更新基金净值后会生成。</p>}</Panel></div>
    <div className="section-heading"><h2>操作历史</h2><span className="muted">包含转出与转入记录</span></div><Panel><HistoryTable fund={f} investorId={p.id} revision={revision}/></Panel>
    {trade&&<TradeDialog kind={trade} fund={f} investorId={p.id} investors={people.data||[p]} onClose={()=>setTrade(null)} onComplete={()=>{setSaved(true);setRevision(n=>n+1);}}/>}
  </>;
}
