import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('oauth_state');

    if (!code) {
      setError('缺少授权码');
      return;
    }

    if (state && savedState && state !== savedState) {
      setError('state 校验失败，请重新登录');
      return;
    }
    sessionStorage.removeItem('oauth_state');

    handleCallback(code)
      .then(() => navigate('/'))
      .catch((err: any) => setError(err.message || '登录失败，请重试'));
  }, [searchParams, handleCallback, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          padding: '40px',
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          textAlign: 'center',
          maxWidth: '420px',
        }}
      >
        {error ? (
          <div style={{ color: 'var(--danger-color)' }}>{error}</div>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>登录中，请稍候...</div>
        )}
      </div>
    </div>
  );
}
