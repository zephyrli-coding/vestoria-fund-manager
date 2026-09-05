import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRemote } from '@/hooks/useRemote';
import { getFunds, download } from '@/utils/fundApi';
import { EXISTING_USD_CNY_ESTIMATE, localDate } from '@/utils/fundFormatting';
import { FundTable } from '@/components/FundTable';
import { ErrorState, Loading, Notice, PageHeader, Panel, WriteButton, WriteLink } from '@/components/ui';
export default function Funds(){
  useDocumentTitle('基金列表 · Compound Fund');
  const navigate=useNavigate(),[params,setParams]=useSearchParams();
  const [search,setSearch]=useState(''),[currency,setCurrency]=useState(''),[sort,setSort]=useState('date'),[descending,setDescending]=useState(true),[exporting,setExporting]=useState(false),[error,setError]=useState('');
  const tag=params.get('tag')||'',funds=useRemote(getFunds,[]);
  const all=funds.data||[],tags=[...new Set(all.flatMap(f=>f.tags?.split(',').map(t=>t.trim()).filter(Boolean)||[]))];
  const filtered=all.filter(f=>(!tag||f.tags?.includes(tag))&&(!currency||f.currency===currency)&&(f.name+' '+f.tags+' '+f.start_date).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{
    let comparison=sort==='name'?a.name.localeCompare(b.name):sort==='nav'?a.net_asset_value-b.net_asset_value:sort==='balance'?a.balance*(a.currency==='USD'?EXISTING_USD_CNY_ESTIMATE:1)-b.balance*(b.currency==='USD'?EXISTING_USD_CNY_ESTIMATE:1):a.start_date.localeCompare(b.start_date);
    return descending?-comparison:comparison;
  });
  const exportFunds=async()=>{setExporting(true);setError('');try{await download('/funds/export'+(tag?'?tag='+encodeURIComponent(tag):''),'funds_'+localDate()+'.zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fund_ids:filtered.map(f=>f.id)})});}catch(e){setError(e instanceof Error?e.message:'导出失败');}finally{setExporting(false);}};
  return <><PageHeader title="基金列表" description="管理基金、查看持仓，让每次更新都有清晰入口。" actions={<><WriteButton onClick={exportFunds} disabled={exporting||!filtered.length}>{exporting?'正在导出…':'导出 ZIP'}</WriteButton><WriteButton onClick={()=>navigate('/data')}>导入基金</WriteButton><WriteLink to="/funds/create" variant="primary">＋ 新建基金</WriteLink></>}/>
    {error&&<Notice tone="error">{error}</Notice>}<Panel><div className="table-toolbar wrap"><label className="search"><input aria-label="搜索基金" placeholder="搜索名称、标签或成立日期" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>搜索</kbd></label><div className="row wrap"><select aria-label="基金币种" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="">全部币种</option><option>CNY</option><option>USD</option></select><select aria-label="基金标签" value={tag} onChange={e=>{const next=new URLSearchParams(params);if(e.target.value)next.set('tag',e.target.value);else next.delete('tag');setParams(next);}}><option value="">全部标签</option>{tags.map(t=><option key={t}>{t}</option>)}</select><select aria-label="基金排序" value={sort} onChange={e=>setSort(e.target.value)}><option value="date">按成立日期</option><option value="name">按名称</option><option value="balance">按资产估算</option><option value="nav">按净值</option></select><button className="button small-button" type="button" onClick={()=>setDescending(!descending)}>{descending?'↓ 降序':'↑ 升序'}</button></div></div>{funds.loading?<Loading/>:funds.error?<ErrorState error={funds.error} retry={funds.reload}/>:<FundTable funds={filtered}/>}</Panel><p className="footnote">资产金额按各基金原币种显示。跨币种资产排序沿用原有 1 USD = {EXISTING_USD_CNY_ESTIMATE} CNY 估算；ZIP 导出当前筛选结果，沿用现有 editor 权限要求。</p>
  </>;
}
