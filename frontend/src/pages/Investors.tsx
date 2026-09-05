import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getFund, getFunds, getInvestors } from '@/utils/fundApi';
import { InvestorTable } from '@/components/InvestorTable';
import { TradeDialog, type TradeKind } from '@/components/TradeDialog';
import { BackLink, Empty, ErrorState, Loading, Notice, PageHeader, Panel } from '@/components/ui';
function FundInvestors({id}:{id:number}){
  const [revision,setRevision]=useState(0),[trade,setTrade]=useState<{kind:TradeKind;id?:number}|null>(null),[saved,setSaved]=useState(false);
  const fund=useRemote(signal=>getFund(id,signal),[id,revision]),people=useRemote(signal=>getInvestors(id,signal),[id,revision]);
  if(fund.loading||people.loading)return <Loading/>;if(fund.error||people.error||!fund.data)return <ErrorState error={fund.error||people.error} retry={()=>{fund.reload();people.reload();}}/>;
  return <><BackLink to={'/funds/'+id}>返回 {fund.data.name}</BackLink>{saved&&<Notice tone="success">操作已记录，投资者数据已刷新。</Notice>}<Panel title={fund.data.name+' · '+fund.data.currency}><InvestorTable fund={fund.data} investors={people.data||[]} onTrade={(kind,id)=>setTrade({kind,id})}/></Panel>{trade&&<TradeDialog fund={fund.data} investors={people.data||[]} kind={trade.kind} investorId={trade.id} onClose={()=>setTrade(null)} onComplete={()=>{setSaved(true);setRevision(n=>n+1);}}/>}</>;
}
export default function Investors(){
  const {id}=useParams(),navigate=useNavigate(),funds=useRemote(getFunds,[]);
  useDocumentTitle('投资者 · Compound Fund');
  return <><PageHeader title="投资者" description="查看每位投资者的份额、投入、赎回与收益。"/><div className="scope-selector"><label>选择基金<select aria-label="选择投资者所属基金" value={id||''} onChange={e=>{if(e.target.value)navigate('/funds/'+e.target.value+'/investors');}}><option value="">请选择基金</option>{funds.data?.map(f=><option key={f.id} value={f.id}>{f.name+' · '+f.currency}</option>)}</select></label><Link className="text-link" to="/funds">管理基金 →</Link></div>{funds.error&&<ErrorState error={funds.error} retry={funds.reload}/>} {id?<FundInvestors key={id} id={Number(id)}/>:funds.loading?<Loading/>:<Panel><Empty title="先选择一只基金" description="投资者与持仓按基金管理，不会将不同币种或不同基金的份额混在一起。"/></Panel>}</>;
}
