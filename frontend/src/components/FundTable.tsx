import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Fund } from '@/types/api';
import { Empty, Pagination, WriteButton, WriteLink } from '@/components/ui';
import { money } from '@/utils/fundApi';
export function FundTable({funds}:{funds:Fund[]}) {
  const [page,setPage]=useState(1),[size,setSize]=useState(20);
  const ids=funds.map(f=>f.id).join(',');
  useEffect(()=>setPage(1),[ids,size]);
  if(!funds.length)return <Empty title="暂无匹配基金" description="调整筛选条件，或创建第一只基金开始记录。"/>;
  return <><div className="table-wrap"><table><thead><tr><th>基金名称</th><th className="number">总资产</th><th className="number">单位净值</th><th className="number">总份额</th><th className="number">投资者</th><th>成立 / 更新</th><th>管理</th></tr></thead><tbody>{funds.slice((page-1)*size,page*size).map(fund=><tr key={fund.id}><td className="fund-name-cell"><Link className="fund-title" to={'/funds/'+fund.id}><span className="fund-mark">{fund.currency}</span><span><strong>{fund.name}</strong><span className="table-sub">#{fund.id}{fund.tags?' · '+fund.tags.split(',').join(' / '):''}</span></span></Link></td><td className="number strong">{money(fund.balance,fund.currency)}</td><td className="number">{fund.net_asset_value.toFixed(6)}</td><td className="number">{fund.total_share.toLocaleString('zh-CN',{maximumFractionDigits:6})}</td><td className="number">{fund.investor_count??0}</td><td>{fund.start_date}<span className="table-sub">{fund.updated_at.slice(0,10)}</span></td><td><Link className="text-link" to={'/funds/'+fund.id}>查看</Link><span className="table-action"><WriteLink to={'/funds/'+fund.id+'/edit'} variant="ghost" className="small-button">编辑</WriteLink></span></td></tr>)}</tbody></table></div><Pagination page={page} pageSize={size} total={funds.length} onPage={setPage} onSize={setSize}/></>;
}
