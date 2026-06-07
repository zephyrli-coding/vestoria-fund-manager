import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { TrendingUp, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export default function Login() {
  const navigate = useNavigate();
  useDocumentTitle('Vestoria - 登录');
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-secondary)',
      }}
    >
      {/* Left Side - Illustration */}
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
        {/* Background Pattern */}
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
            现代化的基金管理系统，助您轻松管理投资组合
          </p>

          <div
            style={{
              display: 'flex',
              gap: '32px',
              justifyContent: 'center',
            }}
          >
            {[
              { label: '基金管理', value: '100+' },
              { label: '投资者', value: '1000+' },
              { label: '交易额', value: '¥1M+' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              欢迎回来
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
              请输入您的账号信息以继续
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger-color)',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                用户名
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s',
                }}
              >
                <User size={20} color="var(--text-muted)" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                密码
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s',
                }}
              >
                <Lock size={20} color="var(--text-muted)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)';
              }}
            >
              {loading ? (
                <span>登录中...</span>
              ) : (
                <>
                  <span>登录</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
