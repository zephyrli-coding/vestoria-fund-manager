import { useState } from 'react';
import products from './products.json';
import icons from './icons.json';

function SharedIcon({ name, className }: { name: keyof typeof icons; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}
export function ProductSwitcher({ current, urls = {}, placement = 'sidebar' }: { current: string; urls?: Record<string, string>; placement?: 'sidebar' | 'header' }) {
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const product = products.find(item => item.id === current)!;
  return <details className={`cu-disclosure cu-product${placement === 'header' ? ' cu-product--header' : ''}`} data-popover="product">
    <summary aria-label="切换产品" aria-expanded="false"><span className="cu-product-icon"><SharedIcon name={product.icon as keyof typeof icons} /></span><span className="cu-product-copy side-label"><strong>{product.name}</strong><small>{product.description}</small></span><SharedIcon name="down" className="cu-chevron side-label" /></summary>
    <nav className="cu-menu" aria-label="切换产品">{products.map(item => {
      return <a key={item.id} href={urls[item.id] || (local ? item.localUrl : item.productionUrl)} aria-current={item.id === current ? 'page' : undefined}><SharedIcon name={item.icon as keyof typeof icons} /><span className="cu-product-copy"><strong>{item.name}</strong><small>{item.description}</small></span>{item.id === current && <span className="cu-current">当前</span>}</a>;
    })}</nav>
  </details>;
}
export function AccountMenu({ name, email, accountUrl, logout }: { name: string; email?: string; accountUrl: string; logout: () => Promise<void> }) {
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  async function leave() {
    setLeaving(true); setError('');
    try { await logout(); } catch { setError('退出未完成，请重试。'); } finally { setLeaving(false); }
  }
  return <details className="cu-disclosure cu-account" data-popover="account">
    <summary aria-label="账号菜单" aria-expanded="false"><span className="cu-avatar">{name.slice(0, 1).toUpperCase()}</span><span className="cu-account-name">{name}</span><SharedIcon name="down" className="cu-chevron" /></summary>
    <div className="cu-menu"><p className="cu-account-email">{email}</p><a href={accountUrl}><SharedIcon name="user" />账号中心</a><button type="button" className="cu-logout" disabled={leaving} onClick={() => void leave()}><SharedIcon name="logout" />{leaving ? '正在退出…' : '退出所有应用'}</button>{error && <p role="alert" className="cu-account-email">{error}</p>}</div>
  </details>;
}
