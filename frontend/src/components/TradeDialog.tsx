import { useRef, useState } from 'react';
import type { Fund, Investor } from '@/types/api';
import { useFundStore } from '@/stores/fund';
import { useAuthStore } from '@/stores/auth';
import { localDate, previewMovement } from '@/utils/fundFormatting';
import { money, shares } from '@/utils/fundApi';
import OperationPreview from '@/components/OperationPreview';
import { Button, Modal, Notice } from '@/components/ui';

export type TradeKind = 'add' | 'invest' | 'redeem' | 'transfer' | 'nav';
const labels: Record<TradeKind,string> = {add:'添加投资者',invest:'申购份额',redeem:'赎回份额',transfer:'份额转让',nav:'更新净值'};
export function TradeDialog({ kind, fund, investors, investorId, onClose, onComplete }: {kind:TradeKind;fund:Fund;investors:Investor[];investorId?:number;onClose:()=>void;onComplete:()=>void}) {
  const canEdit = useAuthStore(s=>Boolean(s.user?.can_edit));
  const [selectedId,setSelectedId]=useState(investorId ? String(investorId) : '');
  const [targetId,setTargetId]=useState('');
  const [name,setName]=useState('');
  const [amount,setAmount]=useState('');
  const [amountType,setAmountType]=useState<'share'|'balance'>('share');
  const [date,setDate]=useState(localDate());
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const pending=useRef(false);
  const selected=investors.find(item=>item.id===Number(selectedId));
  const number=Number(amount);
  const movement=selected && ['redeem','transfer'].includes(kind) ? previewMovement(selected.share,fund.net_asset_value,number,amountType) : null;
  const currency=fund.currency === 'USD' ? 'USD / $' : 'CNY / ¥';
  const submit=async (event:React.FormEvent)=>{
    event.preventDefault();
    if(pending.current || !canEdit)return;
    setError('');
    if(kind==='add' && !name.trim()){setError('请输入投资者姓名');return;}
    if(kind!=='add' && (!Number.isFinite(number)||number<=0)){setError('请输入大于 0 的有效数值');return;}
    if(['invest','redeem','transfer'].includes(kind) && !selected){setError('请选择投资者');return;}
    if(kind==='transfer' && (!targetId || targetId===selectedId)){setError('请选择不同的转入投资者');return;}
    if(movement && movement.shares<=0){setError('可用份额不足，或输入金额低于六位小数精度');return;}
    pending.current=true;setBusy(true);
    try{
      const store=useFundStore.getState();
      if(kind==='add')await store.addInvestor(fund.id,name.trim(),date);
      if(kind==='invest')await store.invest(fund.id,selected!.id,number,date);
      if(kind==='redeem')await store.redeem(fund.id,selected!.id,number,amountType,date);
      if(kind==='transfer')await store.transfer(fund.id,selected!.id,Number(targetId),number,amountType,date);
      if(kind==='nav')await store.updateNav(fund.id,number,date);
      onComplete();onClose();
    }catch(error){setError(error instanceof Error ? error.message : '操作失败，请检查后重试。');}
    finally{pending.current=false;setBusy(false);}
  };
  return <Modal title={labels[kind]} description={fund.name+' · '+currency+' · 当前 NAV '+fund.net_asset_value.toFixed(6)} onClose={onClose} busy={busy} footer={<><Button disabled={busy} onClick={onClose}>取消</Button><Button variant="primary" type="submit" form="fund-trade-form" disabled={busy||!canEdit}>{busy?'正在提交…':'确认'+(kind==='add'?'添加':kind==='nav'?'更新':kind==='invest'?'申购':kind==='redeem'?'赎回':'转让')}</Button></>}>
    <form id="fund-trade-form" onSubmit={submit}><fieldset disabled={busy||!canEdit}>{error && <Notice tone="error">{error}</Notice>}
      {kind==='add' ? <label className="field">投资者姓名<input name="investor-name" value={name} maxLength={100} onChange={e=>setName(e.target.value)} required autoFocus placeholder="输入真实投资者名称" /></label> : kind!=='nav' && <label className="field">{kind==='transfer'?'转出投资者':'投资者'}<select name="investor-id" value={selectedId} onChange={e=>setSelectedId(e.target.value)} required autoFocus><option value="">请选择投资者</option>{investors.map(item=><option key={item.id} value={item.id}>{item.name+' · '+shares(item.share)+' 份'}</option>)}</select></label>}
      {kind==='transfer' && <label className="field">转入投资者<select name="target-id" value={targetId} onChange={e=>setTargetId(e.target.value)} required><option value="">请选择不同的转入方</option>{investors.filter(item=>item.id!==Number(selectedId)).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {['redeem','transfer'].includes(kind) && <div className="field"><span>操作单位</span><div className="segmented">{(['share','balance'] as const).map(type=><button type="button" key={type} aria-pressed={amountType===type} className={amountType===type?'active':''} onClick={()=>setAmountType(type)}>{type==='share'?'按份额':'按金额'}</button>)}</div>{selected && <span className="field-hint">可用 {shares(selected.share)} 份 / {money(selected.balance,fund.currency)}。<button type="button" className="text-link" onClick={()=>setAmount(String(amountType==='share'?selected.share:selected.balance))}>使用全部</button></span>}</div>}
      {kind!=='add' && <label className="field">{kind==='nav'?'新的基金总资产 ('+currency+')':kind==='invest'||amountType==='balance'?'金额 ('+currency+')':'份额'}<input name="amount" type="number" inputMode="decimal" min={['redeem','transfer'].includes(kind)&&amountType==='share'?'0.000001':'0.01'} step={['redeem','transfer'].includes(kind)&&amountType==='share'?'0.000001':'0.01'} value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="0.00" /></label>}
      <label className="field">记账日期<input name="operation-date" type="date" value={date} onChange={e=>setDate(e.target.value)} required /></label>
      {kind==='invest' && Number.isFinite(number)&&number>0&&fund.net_asset_value>0 && <OperationPreview title="申购预览" rows={[{label:'申购金额',value:money(number,fund.currency)},{label:'预计新增份额',value:(number/fund.net_asset_value).toFixed(6)},{label:'使用净值',value:fund.net_asset_value.toFixed(6)},{label:'记账日期',value:date}]} />}
      {movement && <OperationPreview title={kind==='redeem'?'赎回预览':'转让预览'} rows={[{label:'预计金额',value:money(movement.balance,fund.currency)},{label:'预计份额',value:movement.shares.toFixed(6)},{label:'操作后剩余份额',value:movement.remainingShares.toFixed(6)},{label:'记账日期',value:date}]} warning={movement.capped?'输入超过可用额度，将按现有规则处理全部可用份额。':kind==='transfer'?'转让不会改变基金总份额。':undefined} />}
      {kind==='nav' && Number.isFinite(number)&&number>0&&fund.total_share>0 && <OperationPreview title="净值更新预览" rows={[{label:'当前净值',value:fund.net_asset_value.toFixed(6)},{label:'预计新净值',value:(number/fund.total_share).toFixed(6)},{label:'新的总资产',value:money(number,fund.currency)},{label:'总份额（不变）',value:shares(fund.total_share)}]} warning="同一天再次更新会替换当天净值与收益快照，操作历史仍会保留。" />}
      {kind==='nav' && fund.total_share<=0 && <Notice tone="warning">当前基金没有份额，请先添加投资者并申购。</Notice>}
    </fieldset></form>
  </Modal>;
}
