import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, ChevronDown, Compass, Download, History, LayoutDashboard, LogOut, Menu, Users, Wallet, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { APP_BASE_PATH, AUTH_SERVICE_URL } from '@/config/api';
import { Button, Notice } from '@/components/ui';

const navigation=[['/','基金总览',LayoutDashboard],['/funds','基金列表',Wallet],['/investors','投资者',Users],['/operations','操作记录',History],['/data','导入与导出',Download]] as const;
export default function MainLayout(){
  const {user,logout}=useAuthStore();
  const location=useLocation();
  const [open,setOpen]=useState(false),[leaving,setLeaving]=useState(false);
  const menuButton=useRef<HTMLButtonElement>(null);
  const local=['localhost','127.0.0.1'].includes(window.location.hostname);
  const products=[
    {name:'Navigation',description:'常用工具与书签',icon:Compass,url:import.meta.env.VITE_NAVIGATION_URL||(local?'http://localhost:20261':'https://navigation.mr-strawberry.com')},
    {name:'Fund Manager',description:'基金与投资者',icon:Wallet,url:APP_BASE_PATH},
    {name:'Data Terminal',description:'行情与研究',icon:BarChart3,url:import.meta.env.VITE_DATA_TERMINAL_URL||(local?'http://localhost:20262':'https://vestoria.mr-strawberry.com/data/')},
    {name:'Account',description:'账号与访问权限',icon:Users,url:AUTH_SERVICE_URL+'/auth/profile'},
  ];
  const current=location.pathname.includes('/investors/')?'投资者详情':location.pathname.endsWith('/edit')?'编辑基金':location.pathname==='/funds/create'?'新建基金':location.pathname.endsWith('/data')?'导入与导出':navigation.find(([path])=>path!=='/'&&location.pathname.startsWith(path))?.[1]||'基金总览';
  useEffect(()=>{setOpen(false);document.querySelector<HTMLElement>('#main-content')?.focus();},[location.pathname]);
  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);menuButton.current?.focus();}};
    document.addEventListener('keydown',close);
    return ()=>document.removeEventListener('keydown',close);
  },[open]);
  return <div className="fund-app"><a className="skip-link" href="#main-content">跳到主要内容</a>{open&&<button className="sidebar-backdrop" aria-label="关闭导航" onClick={()=>{setOpen(false);menuButton.current?.focus();}}/>}
    <aside className={'sidebar '+(open?'is-open':'')} aria-label="基金工作区导航"><Link className="brand" to="/"><img className="brand-logo" src={`${import.meta.env.BASE_URL}brand-strawberry-a.png`} alt="快刀切草莓君" width={40} height={40} />compound</Link>
      <details className="workspace-selector"><summary><span className="workspace-icon"><Wallet size={17}/></span><span>Fund Manager<small>基金管理工作区</small></span><ChevronDown size={15}/></summary><nav className="workspace-menu" aria-label="切换产品">{products.map(product=><a key={product.name} href={product.url}><product.icon size={17}/><span>{product.name}<small>{product.description}</small></span></a>)}</nav></details>
      <div className="nav-label">工作空间</div><nav className="side-nav">{navigation.map(([path,label,Icon])=><NavLink to={path} end={path==='/'} key={path} className={({isActive})=>'nav-item '+(isActive?'active':'')}><Icon size={18}/>{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><a className="nav-item" href={AUTH_SERVICE_URL+'/auth/profile'}><Users size={18}/>账号中心<span className="external">↗</span></a><Button variant="ghost" className="nav-item" disabled={leaving} onClick={async()=>{setLeaving(true);try{await logout();}finally{setLeaving(false);}}}><LogOut size={17}/>{leaving?'正在退出…':'退出统一账号'}</Button><div className="sidebar-foot"><span className="avatar">{(user?.username||user?.email||'U').slice(0,1).toUpperCase()}</span><span className="user-identity"><strong>{user?.username||'当前用户'}</strong><small>{user?.email}</small></span></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button ref={menuButton} className="icon-button mobile-menu" aria-label="打开导航" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button><span className="workspace-breadcrumb">工作空间</span><span className="workspace-breadcrumb">/</span><strong>{current}</strong></div><div className="topbar-right"><span className={'badge '+(user?.can_edit?'blue-badge':'')}>{user?.can_edit?'Editor · 可编辑':'Viewer · 只读'}</span><a className="avatar" href={AUTH_SERVICE_URL+'/auth/profile'} aria-label="打开账号中心">{(user?.username||'U').slice(0,1).toUpperCase()}</a></div></header>
      <main className="content" id="main-content" tabIndex={-1}>{!user?.can_edit&&<Notice>当前为 Viewer 只读模式，可查看基金、投资者、历史及导出单基金记录。录入与修改需管理员授权。</Notice>}<Outlet/><footer className="app-footer"><span>COMPOUND / FUND MANAGER</span><span>真实记录 · 独立权限 · 长期积累</span></footer></main>
    </div>
  </div>;
}
