import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

// Layouts
import MainLayout from '@/layouts/MainLayout';

import { useAuthStore } from '@/stores/auth';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#1890ff',
      },
    }}>
      <Router>
        {/* 公共路由 - 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 受保护的路由 */}
        {isAuthenticated ? (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            {/* 更多路由将在后续添加 */}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Router>
    </ConfigProvider>
  );
}

export default App;
