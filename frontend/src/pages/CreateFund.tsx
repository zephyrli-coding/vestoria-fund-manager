import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  ArrowLeft,
  Plus,
  Calendar,
  FileText,
  AlertCircle,
  Check,
  X,
  Tag
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';

export default function CreateFund() {
  const navigate = useNavigate();
  const { createFund } = useFundStore();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入基金名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createFund({ name: name.trim(), start_date: startDate, currency, tags });
      navigate('/funds');
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <Link
        to="/funds"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} />
        返回基金列表
      </Link>

      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Plus size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            创建新基金
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            填写以下信息创建一个新的基金
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger-color)',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              基金名称 *
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              <FileText size={20} color="var(--text-muted)" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：稳健成长一号"
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

          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              成立日期 *
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              <Calendar size={20} color="var(--text-muted)" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
                required
              />
            </div>
          </div>

          {/* 币种选择 */}
          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              结算币种 *
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCurrency('CNY')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: currency === 'CNY' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  background: currency === 'CNY' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                  color: currency === 'CNY' ? '#6366f1' : 'var(--text-secondary)',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>¥</span>
                人民币
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: currency === 'USD' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  background: currency === 'USD' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                  color: currency === 'USD' ? '#6366f1' : 'var(--text-secondary)',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>$</span>
                美元
              </button>
            </div>
          </div>

          {/* Tags Input */}
          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              标签
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              <Tag size={20} color="var(--text-muted)" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如：稳健, 成长, 股票型 (用逗号分隔)"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
              多个标签请用逗号分隔，如：稳健, 成长, 股票型
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              to="/funds"
              style={{
                flex: 1,
                padding: '14px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                fontSize: '15px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              取消
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>创建中...</>
              ) : (
                <>
                  <Check size={18} />
                  创建基金
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
