import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { AUTH_SERVICE_URL } from '@/config/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui';
export default function Login(){
  useDocumentTitle('登录 · Compound Fund');
  const login=useAuthStore(s=>s.login),loggedOut=new URLSearchParams(window.location.search).get('logged_out')==='1';
  useEffect(()=>{if(!loggedOut)login();},[loggedOut,login]);
  return <main className="auth-shell"><a className="brand" href={AUTH_SERVICE_URL+'/auth/profile'}><img className="brand-logo" src={`${import.meta.env.BASE_URL}brand-strawberry-a.png`} alt="快刀切草莓君" width={40} height={40} />compound</a><section className="auth-card"><div className="eyebrow">YOUR FUND WORKSPACE</div><h1>{loggedOut?'已安全退出':'连接你的基金工作区'}</h1><p>{loggedOut?'统一账号已退出。再次登录后，可按已授权角色继续查看或管理基金。':'正在前往 Compound 账号中心，使用真实账号与已分配的访问权限。'}</p><Button variant="primary" onClick={login}>{loggedOut?'重新登录':'前往账号中心登录'}</Button><p className="footnote">Fund 需要验证邮箱并获得 viewer / editor 授权。登录由统一账号中心完成。</p></section></main>;
}
