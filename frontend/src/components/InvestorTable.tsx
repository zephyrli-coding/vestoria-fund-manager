import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Fund, Investor } from '@/types/api';
import type { TradeKind } from '@/components/TradeDialog';
import { CopyNumber, Empty, Pagination, WriteButton } from '@/components/ui';
import { investorReturn, money, shares } from '@/utils/fundApi';
export function InvestorTable({fund,investors,onTrade}:{fund:Fund;investors:Investor[];onTrade:(kind:TradeKind,id?:number)=>void}) {
  const [search,setSearch]=useState(''),[page,setPage]=useState(1),[size,setSize]=useState(20);
  const filtered=investors.filter(item=>item.name.toLowerCase().includes(search.trim().toLowerCase()));
  useEffect(()=>setPage(1),[search,size,fund.id]);
  return <><div className="table-toolbar"><label className="search"><span className="sr-only">搜索投资者</span><input aria-label="搜索投资者" value={search} placeholder="搜索投资者姓名" onChange={e=>setSearch(e.target.value)} /></label><WriteButton onClick={()=>onTrade('add')}>添加投资者</WriteButton></div>{!filtered.length?<Empty title={search?'没有匹配的投资者':'尚未添加投资者'} description="投资者以当前基金为单位管理。"/>:<div className="table-wrap"><table><thead><tr><th>投资者</th><th className="number">持有份额</th><th className="number">当前资产</th><th className="number">累计投入 / 赎回</th><th className="number">累计收益</th><th className="number">收益率</th><th>操作</th></tr></thead><tbody>{filtered.slice((page-1)*size,page*size).map(item=>{
    const profit=investorReturn(item,fund),rate=item.total_invested>0?profit/item.total_invested*100:null;
    return <tr key={item.id}><td><Link className="table-title" to={'/funds/'+fund.id+'/investors/'+item.id}>{item.name}</Link><span className="table-sub">#{item.id} · {item.creation_date?.slice(0,10)||item.created_at.slice(0,10)}</span></td><td className="number"><CopyNumber value={item.share} display={shares(item.share)}/></td><td className="number">{money(item.balance,fund.currency)}</td><td className="number">{money(item.total_invested,fund.currency)}<span className="table-sub">{money(item.total_redeemed,fund.currency)}</span></td><td className={'number '+(profit>=0?'positive':'negative')}>{money(profit,fund.currency,true)}</td><td className={'number '+(profit>=0?'positive':'negative')}>{rate===null?'--':(rate>=0?'+':'')+rate.toFixed(2)+'%'}</td><td><div className="row"><WriteButton variant="ghost" className="small-button" onClick={()=>onTrade('invest',item.id)}>申购</WriteButton><WriteButton variant="ghost" className="small-button" disabled={item.share<=0} onClick={()=>onTrade('redeem',item.id)}>赎回</WriteButton><WriteButton variant="ghost" className="small-button" disabled={item.share<=0||investors.length<2} onClick={()=>onTrade('transfer',item.id)}>转让</WriteButton></div></td></tr>;
  })}</tbody></table></div>}<Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} onSize={setSize}/></>;
}
