import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getFunds, getValuation, download } from '@/utils/fundApi';
import { localDate } from '@/utils/fundFormatting';
import { FxNotice } from '@/components/FxNotice';
import { FundTable } from '@/components/FundTable';
import { ErrorState, Loading, Notice, PageHeader, Panel, WriteButton, WriteLink } from '@/components/ui';
export default function Funds(){
  useDocumentTitle('基金列表 · Compound Fund');
  const navigate=useNavigate(),[params,setParams]=useSearchParams();
  const [search,setSearch]=useState(''),[currency,setCurrency]=useState(''),[sort,setSort]=useState('date'),[descending,setDescending]=useState(true),[exporting,setExporting]=useState(false),[error,setError]=useState('');
  const tag=params.get('tag')||'',funds=useRemote(getFunds,[]);
  const valuation=useRemote(signal=>getValuation('',signal),[]);
  const estimates=new Map((valuation.data?.items||[]).map(row=>[row.id,row.CNY]));
  const comparable=(funds.data||[]).every(f=>estimates.get(f.id)!=null);
  const all=funds.data||[],tags=[...new Set(all.flatMap(f=>f.tags?.split(',').map(t=>t.trim()).filter(Boolean)||[]))];
  const filtered=all.filter(f=>(!tag||f.tags?.includes(tag))&&(!currency||f.currency===currency)&&(f.name+' '+f.tags+' '+f.start_date).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{
    let comparison=sort==='name'?a.name.localeCompare(b.name):sort==='nav'?a.net_asset_value-b.net_asset_value:sort==='balance'?(currency?a.balance-b.balance:comparable?(estimates.get(a.id)!-estimates.get(b.id)!):a.start_date.localeCompare(b.start_date)):a.start_date.localeCompare(b.start_date);
    return descending?-comparison:comparison;
  });
  const exportFunds=async()=>{setExporting(true);setError('');try{await download('/funds/export'+(tag?'?tag='+encodeURIComponent(tag):''),'funds_'+localDate()+'.zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fund_ids:filtered.map(f=>f.id)})});}catch(e){setError(e instanceof Error?e.message:'导出失败');}finally{setExporting(false);}};
  return <><PageHeader title="基金列表" description="管理基金、查看持仓，让每次更新都有清晰入口。" actions={<><WriteButton onClick={exportFunds} disabled={exporting||!filtered.length}>{exporting?'正在导出…':'导出 ZIP'}</WriteButton><WriteButton onClick={()=>navigate('/data')}>导入基金</WriteButton><WriteLink to="/funds/create" variant="primary">＋ 新建基金</WriteLink></>}/>
    {error&&<Notice tone="error">{error}</Notice>}<Panel><div className="table-toolbar wrap"><label className="search"><input aria-label="搜索基金" placeholder="搜索名称、标签或成立日期" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>搜索</kbd></label><div className="row wrap"><select aria-label="基金币种" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="">全部币种</option><option>CNY</option><option>USD</option></select><select aria-label="基金标签" value={tag} onChange={e=>{const next=new URLSearchParams(params);if(e.target.value)next.set('tag',e.target.value);else next.delete('tag');setParams(next);}}><option value="">全部标签</option>{tags.map(t=><option key={t}>{t}</option>)}</select><select aria-label="基金排序" value={sort} onChange={e=>setSort(e.target.value)}><option value="date">按成立日期</option><option value="name">按名称</option><option value="balance" disabled={!currency&&!comparable}>按资产估值</option><option value="nav">按净值</option></select><button className="button small-button" type="button" onClick={()=>setDescending(!descending)}>{descending?'↓ 降序':'↑ 升序'}</button></div></div>{funds.loading?<Loading/>:funds.error?<ErrorState error={funds.error} retry={funds.reload}/>:<FundTable funds={filtered}/>}</Panel>{valuation.error?<ErrorState error={valuation.error} retry={valuation.reload}/>:<FxNotice fx={valuation.data?.fx}/>}<p className="footnote">资产金额按原币显示。全部币种按最新参考汇率统一折算 CNY 排序；单币种按原币金额排序。汇率缺失时跨币种资产排序不可用，将按成立日期排列。ZIP 导出保留原币账务。</p>
  </>;
}
