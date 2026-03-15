import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/funds', label: '基金管理', icon: Wallet },
];

export default function MainLayout() {
  const { logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          height: '64px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={22} color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              Vestoria
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '-2px',
              }}
            >
              基金管理系统
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button - Right of Logo */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            marginRight: '16px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.color = 'var(--primary-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            flex: 1,
            maxWidth: '400px',
            marginRight: 'auto',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="搜索基金、投资者..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          />
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notification */}
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.color = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Bell size={20} />
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--danger-color)',
              }}
            />
          </button>

          {/* User */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              草
            </div>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                草莓君
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '-2px',
                }}
              >
                管理员
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div style={{ display: 'flex', flex: 1, marginTop: '64px' }}>
        {/* Sidebar - Below Navigation Bar */}
        <aside
          style={{
            position: isMobile ? 'fixed' : 'relative',
            left: 0,
            top: 0,
            height: isMobile ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
            width: sidebarOpen ? '240px' : '72px',
            background: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-color)',
            transition: 'width 0.3s ease, transform 0.3s ease',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.06)' : 'none',
            transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          {/* Navigation */}
          <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px',
                marginLeft: sidebarOpen ? '12px' : '0',
                textAlign: sidebarOpen ? 'left' : 'center',
              }}
            >
              {sidebarOpen ? '主菜单' : '•••'}
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: sidebarOpen ? '12px 16px' : '12px',
                    marginBottom: '4px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    border: active ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={20} />
                  {sidebarOpen && (
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                  )}
                  {sidebarOpen && active && (
                    <ChevronRight
                      size={16}
                      style={{ marginLeft: 'auto', opacity: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div
            style={{
              padding: '16px 12px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => logout()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: sidebarOpen ? '12px 16px' : '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = 'var(--danger-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut size={20} />
              {sidebarOpen && <span>退出登录</span>}
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMobile && sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 98,
              top: '64px',
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            minWidth: 0,
            marginLeft: isMobile ? 0 : undefined,
          }}
        >
          {/* Page Content */}
          <div
            style={{
              flex: 1,
              padding: '24px 32px',
              overflowY: 'auto',
              height: 'calc(100vh - 64px)',
            }}
          >
            <div
              style={{
                maxWidth: '1600px',
                margin: '0 auto',
              }}
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
