import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { AUTH_SERVICE_URL, OAUTH_STATE_KEY } from '@/config/api';
import { Button, Loading, Notice } from '@/components/ui';
export default function AuthCallback(){
  const navigate=useNavigate(),[params]=useSearchParams(),{handleCallback,login}=useAuthStore(),started=useRef(false),[error,setError]=useState('');
  useEffect(()=>{
    if(started.current)return;started.current=true;
    const code=params.get('code'),state=params.get('state'),saved=sessionStorage.getItem(OAUTH_STATE_KEY);
    if(!code){setError('授权未完成或缺少授权码，请重新发起登录。');return;}
    if(!state||!saved||state!==saved){setError('登录状态校验失败，请从 Fund 重新发起登录，不要刷新或复用回调链接。');return;}
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    handleCallback(code).then(()=>navigate('/',{replace:true})).catch(e=>setError(e instanceof Error?e.message:'登录未完成，请重试。'));
  },[params,handleCallback,navigate]);
  return <main className="auth-shell"><div className="brand"><img className="brand-logo" src={`${import.meta.env.BASE_URL}brand-strawberry.png`} alt="快刀切草莓君" width={40} height={40} />compound</div><section className="auth-card"><div className="eyebrow">FUND / ACCESS</div><h1>{error?'暂时无法进入 Fund':'正在确认你的访问权限'}</h1>{error?<><Notice tone="error">{error}</Notice><p>Fund 需要已验证邮箱及应用访问授权。请到账号中心确认邮箱状态，并联系管理员分配 viewer 或 editor 权限。</p><div className="row wrap"><Button variant="primary" onClick={login}>重新登录</Button><a className="button" href={AUTH_SERVICE_URL+'/auth/profile'}>账号中心</a></div></>:<Loading label="正在建立安全会话…"/>}</section></main>;
}
