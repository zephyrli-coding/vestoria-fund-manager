import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { APP_BASE_PATH } from '@/config/api';
import { useAuthStore } from '@/stores/auth';
import MainLayout from '@/layouts/MainLayout';
import { Loading } from '@/components/ui';
const Dashboard=lazy(()=>import('@/pages/Dashboard'));
const Funds=lazy(()=>import('@/pages/Funds'));
const FundDetail=lazy(()=>import('@/pages/FundDetail'));
const CreateFund=lazy(()=>import('@/pages/CreateFund'));
const EditFund=lazy(()=>import('@/pages/EditFund'));
const Investors=lazy(()=>import('@/pages/Investors'));
const InvestorDetail=lazy(()=>import('@/pages/InvestorDetail'));
const Operations=lazy(()=>import('@/pages/Operations'));
const DataImportExport=lazy(()=>import('@/pages/DataImportExport'));
const Login=lazy(()=>import('@/pages/Login'));
const AuthCallback=lazy(()=>import('@/pages/AuthCallback'));
export default function App(){
  const {isAuthenticated,checkAuth,user,isLoggingOut}=useAuthStore(),[ready,setReady]=useState(false);
  useEffect(()=>{void checkAuth().finally(()=>setReady(true));},[checkAuth]);
  if(!ready||isLoggingOut)return <div className="auth-shell"><Loading label={isLoggingOut?'正在退出统一账号…':'正在检查安全会话…'}/></div>;
  return <BrowserRouter basename={APP_BASE_PATH}><Suspense fallback={<Loading/>}><Routes><Route path="/login" element={<Login/>}/><Route path="/auth/callback" element={<AuthCallback/>}/>{isAuthenticated?<Route path="/" element={<MainLayout/>}><Route index element={<Dashboard/>}/><Route path="funds" element={<Funds/>}/><Route path="funds/create" element={user?.can_edit?<CreateFund/>:<Navigate to="/funds" replace/>}/><Route path="funds/:id" element={<FundDetail/>}/><Route path="funds/:id/edit" element={user?.can_edit?<EditFund/>:<Navigate to="/funds" replace/>}/><Route path="funds/:id/investors" element={<Investors/>}/><Route path="funds/:id/investors/:investorId" element={<InvestorDetail/>}/><Route path="funds/:id/data" element={<DataImportExport/>}/><Route path="investors" element={<Investors/>}/><Route path="operations" element={<Operations/>}/><Route path="data" element={<DataImportExport/>}/></Route>:<Route path="*" element={<Navigate to="/login" replace/>}/>}<Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense></BrowserRouter>;
}
