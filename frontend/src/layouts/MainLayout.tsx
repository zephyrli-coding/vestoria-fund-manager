import { useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Download, History, LayoutDashboard, Menu, Users, Wallet, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { APP_BASE_PATH, AUTH_SERVICE_URL } from '@/config/api';
import { Notice } from '@/components/ui';

import { ProductSwitcher, AccountMenu } from '@/shared/WorkspaceMenus';
import { useMobileDrawer } from '@/shared/useMobileDrawer';

const navigation=[['/','基金总览',LayoutDashboard],['/funds','基金列表',Wallet],['/investors','投资者',Users],['/operations','操作记录',History],['/data','导入与导出',Download]] as const;
export default function MainLayout(){
  const {user,logout}=useAuthStore();
  const location=useLocation();
  const { open, setOpen, sideRef, menuButton } = useMobileDrawer();
  const displayName = user?.display_name || user?.email?.split('@')[0] || '当前用户';
  const local=['localhost','127.0.0.1'].includes(window.location.hostname);
  useEffect(()=>{setOpen(false);document.querySelector<HTMLElement>('#main-content')?.focus();},[location.pathname]);
  return <div className="fund-app"><a className="skip-link" href="#main-content">跳到主要内容</a>{open&&<button className="sidebar-backdrop" aria-label="关闭导航" onClick={()=>{setOpen(false);menuButton.current?.focus();}}/>}
    <aside id="product-navigation" ref={sideRef} role={open ? 'dialog' : undefined} aria-modal={open || undefined} className={'sidebar cu-sidebar '+(open?'is-open':'')} aria-label="基金工作区导航"><div className="cu-sidebar-header"><Link className="brand cu-brand" to="/"><img className="brand-logo" src={`${import.meta.env.BASE_URL}brand-strawberry-a.png`} alt="快刀切草莓君" width={40} height={40} /><span>Compound</span></Link><button className="cu-drawer-close" aria-label="关闭导航" onClick={()=>setOpen(false)}><X size={18} /></button></div>
      <ProductSwitcher current="vestoria" urls={{vestoria: APP_BASE_PATH, account: AUTH_SERVICE_URL+'/auth/profile', navigation: import.meta.env.VITE_NAVIGATION_URL || (local ? 'http://localhost:20261/' : 'https://navigation.mr-strawberry.com/'), 'data-terminal': import.meta.env.VITE_DATA_TERMINAL_URL || (local ? 'http://localhost:20262/' : 'https://vestoria.mr-strawberry.com/data/')}} />
      <div className="cu-sidebar-scroll">      <div className="nav-label cu-nav-label">工作空间</div><nav className="side-nav">{navigation.map(([path,label,Icon])=><NavLink to={path} end={path==='/'} key={path} className={({isActive})=>'nav-item '+(isActive?'active':'')}><Icon size={18}/>{label}</NavLink>)}</nav>
</div>
      <div className="sidebar-bottom"><AccountMenu placement="sidebar" role={user?.can_edit ? 'Editor · 可编辑' : 'Viewer · 只读'} name={displayName} email={user?.email} accountUrl={AUTH_SERVICE_URL+'/auth/profile'} logout={logout} /><p className="cu-sidebar-note side-label">独立应用 · 统一账号</p></div>
    </aside>
    <div className="workspace"><header className="cu-mobile-topbar"><div className="cu-mobile-topbar-left"><button ref={menuButton} className="mobile-menu cu-nav-toggle" aria-label="打开导航" aria-controls="product-navigation" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={18} /></button><Link to="/" className="cu-mobile-brand" aria-label="Compound 首页"><img src={`${import.meta.env.BASE_URL}brand-strawberry-a.png`} alt="" width={32} height={32} /><span>Compound</span></Link></div><AccountMenu name={displayName} email={user?.email} role={user?.can_edit ? 'Editor · 可编辑' : 'Viewer · 只读'} accountUrl={AUTH_SERVICE_URL+'/auth/profile'} logout={logout} /></header>
      <main className="content cu-content" id="main-content" tabIndex={-1}>{!user?.can_edit&&<Notice>当前为 Viewer 只读模式，可查看基金、投资者、历史及导出单基金记录。录入与修改需管理员授权。</Notice>}<Outlet/><footer className="app-footer cu-footer"><span>Compound · Fund Manager</span><span>独立应用 · 统一账号</span></footer></main>
    </div>
  </div>;
}
