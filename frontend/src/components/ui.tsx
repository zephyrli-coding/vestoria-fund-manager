import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Copy, LoaderCircle, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { AUTH_SERVICE_URL } from '@/config/api';

export function Button({ className = '', variant = 'default', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' | 'ghost' }) {
  return <button type="button" {...props} className={'button ' + variant + ' ' + className} />;
}
export function WriteButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' | 'ghost' }) {
  const canEdit = useAuthStore(s => Boolean(s.user?.can_edit));
  return <Button {...props} disabled={!canEdit || props.disabled} title={!canEdit ? '只读账号，需要 editor 权限' : props.title} />;
}
export function WriteLink({to,children,className='',variant='default'}:{to:string;children:ReactNode;className?:string;variant?:'default'|'primary'|'danger'|'ghost'}) {
  const canEdit=useAuthStore(s=>Boolean(s.user?.can_edit));
  return canEdit ? <Link to={to} className={'button '+variant+' '+className}>{children}</Link> : <Button disabled variant={variant} className={className} title="只读账号，需要 editor 权限">{children}</Button>;
}
export function PageHeader({ title, description, eyebrow = 'VESTORIA / FUND MANAGER', actions }: { title: string; description?: string; eyebrow?: string; actions?: ReactNode }) {
  return <header className="page-head"><div className="page-title"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="head-actions">{actions}</div>}</header>;
}
export function Panel({ title, caption, actions, children, className = '' }: { title?: string; caption?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={'panel ' + className}>{(title || actions) && <div className="panel-heading"><div><h2>{title}</h2>{caption && <p>{caption}</p>}</div>{actions}</div>}{children}</section>;
}
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' | 'warning' }) {
  return <div className={'notice ' + tone} role={tone === 'error' ? 'alert' : 'status'}><AlertCircle size={16} aria-hidden="true" /><div>{children}</div></div>;
}
export function Empty({ title = '暂无数据', description, children }: { title?: string; description?: string; children?: ReactNode }) {
  return <div className="empty-state"><div className="empty-mark"><ArrowRight size={22} /></div><h3>{title}</h3>{description && <p>{description}</p>}{children}</div>;
}
export function Loading({ label = '正在加载真实数据…' }: { label?: string }) {
  return <div className="loading-state" role="status"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const login = useAuthStore(s => s.login);
  const message = error instanceof Error ? error.message : '请求未完成，请稍后重试。';
  return <div className="error-state"><Notice tone="error">{message}</Notice><div className="row wrap">{retry && <Button onClick={retry}>重新加载</Button>}<Button onClick={login}>重新登录</Button><a className="text-link" href={AUTH_SERVICE_URL + '/auth/profile'}>账号与访问权限</a></div></div>;
}
export function Modal({ title, description, children, footer, onClose, busy = false }: { title: string; description?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useRef('dialog-' + Math.random().toString(36).slice(2));
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); active?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId.current} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === ref.current && !busy) onClose(); }}>
    <div className="modal-shell"><header className="modal-head"><div><h2 id={titleId.current}>{title}</h2>{description && <p>{description}</p>}</div><Button variant="ghost" className="icon-button" aria-label="关闭弹窗" disabled={busy} onClick={onClose}><X size={18} /></Button></header><div className="modal-body">{children}</div>{footer && <footer className="modal-actions">{footer}</footer>}</div>
  </dialog>;
}
export function Pagination({ page, pageSize, total, onPage, onSize }: { page: number; pageSize: number; total: number; onPage: (page: number) => void; onSize?: (size: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="table-footer"><span>共 {total} 条{total > 0 ? ' · ' + ((page - 1) * pageSize + 1) + '–' + Math.min(page * pageSize, total) : ''}</span><div className="row wrap">{onSize && <select aria-label="每页条数" value={pageSize} onChange={e => onSize(Number(e.target.value))}>{[10, 20, 50, 100].map(size => <option key={size} value={size}>{size} 条 / 页</option>)}</select>}<Button className="small-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</Button><span>{page} / {pages}</span><Button className="small-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>下一页</Button></div></div>;
}
export function CopyNumber({ value, display }: { value: number; display: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="copy-number" title="复制原始数值" aria-label={'复制数值 ' + display} onClick={async () => { try { await navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }}>{display}{copied ? <Check size={12} /> : <Copy size={12} />}</button>;
}
export function BackLink({ to = '/funds', children = '返回基金列表' }: { to?: string; children?: ReactNode }) {
  return <Link className="back-link" to={to}>← {children}</Link>;
}
