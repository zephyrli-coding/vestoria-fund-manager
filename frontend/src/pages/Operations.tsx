import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getFunds, getInvestors } from '@/utils/fundApi';
import { Empty, ErrorState, Loading, PageHeader, Panel } from '@/components/ui';
import { HistoryTable } from '@/components/HistoryTable';
export default function Operations(){
  const [params,setParams]=useSearchParams(),id=Number(params.get('fund')||0);
  const funds=useRemote(getFunds,[]),people=useRemote(signal=>id?getInvestors(id,signal):Promise.resolve([]),[id]);
  const fund=funds.data?.find(item=>item.id===id);
  useDocumentTitle('操作记录 · Compound Fund');
  return <><PageHeader title="操作记录" description="每一次申购、赎回、转让与净值更新，都有据可查。"/><div className="scope-selector"><label>选择基金<select aria-label="选择历史所属基金" value={id||''} onChange={e=>setParams({fund:e.target.value})}><option value="">请选择基金</option>{funds.data?.map(f=><option key={f.id} value={f.id}>{f.name+' · '+f.currency}</option>)}</select></label></div>{funds.loading?<Loading/>:funds.error?<ErrorState error={funds.error} retry={funds.reload}/>:fund?<Panel><HistoryTable key={fund.id} fund={fund} investors={people.data||[]}/></Panel>:<Panel><Empty title="选择基金后查看完整历史" description="可按操作类型、投资者和日期筛选，所有记录均可翻页查看。"/></Panel>}</>;
}
