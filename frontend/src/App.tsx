import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Funds from '@/pages/Funds';
import FundDetail from '@/pages/FundDetail';
import InvestorDetail from '@/pages/InvestorDetail';
import Investors from '@/pages/Investors';
import EditFund from '@/pages/EditFund';
import CreateFund from '@/pages/CreateFund';
import DataImportExport from '@/pages/DataImportExport';

// Layouts
import MainLayout from '@/layouts/MainLayout';

import { useAuthStore } from '@/stores/auth';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // 页面加载时检查 token 是否有效
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 等待认证检查完成
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: 'var(--primary-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 公共路由 - 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 受保护的路由 */}
        {isAuthenticated ? (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="funds" element={<Funds />} />
            <Route path="funds/create" element={<CreateFund />} />
            <Route path="funds/:id/investors" element={<Investors />} />
            <Route path="funds/:id/investors/:investorId" element={<InvestorDetail />} />
            <Route path="funds/:id/edit" element={<EditFund />} />
            <Route path="funds/:id" element={<FundDetail />} />
            <Route path="funds/:id/data" element={<DataImportExport />} />
            <Route path="investors" element={<Investors />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        {/* 未匹配路由重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
