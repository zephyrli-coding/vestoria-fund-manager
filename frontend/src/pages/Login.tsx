import { useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export default function Login() {
  useDocumentTitle('Vestoria - 登录');
  const { login } = useAuthStore();

  useEffect(() => {
    // 自动跳转到统一认证中心
    login();
  }, [login]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '28px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 40px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <TrendingUp size={56} color="white" />
          </div>

          <h1
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 16px 0',
              letterSpacing: '-1px',
            }}
          >
            Vestoria
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 40px 0',
              maxWidth: '400px',
            }}
          >
            正在跳转统一账号中心...
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            如果页面没有自动跳转，请
            <button
              onClick={login}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '15px',
                textDecoration: 'underline',
              }}
            >
              点击这里登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
