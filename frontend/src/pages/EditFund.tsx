import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FileText,
  Calendar,
  AlertCircle,
  Check,
  Trash2,
  Tag
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Fund } from '@/types/api';

export default function EditFund() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchFundById, updateFund, deleteFund } = useFundStore();
  
  const [fund, setFund] = useState<Fund | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [currency, setCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadFund = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchFundById(parseInt(id));
        if (data) {
          setFund(data);
          setName(data.name);
          setStartDate(data.start_date);
          setCurrency(data.currency || 'CNY');
          setTags(data.tags || '');
        }
      } catch (err) {
        setError('加载基金信息失败');
      } finally {
        setLoading(false);
      }
    };
    loadFund();
  }, [id, fetchFundById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) {
      setError('请输入基金名称');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateFund(parseInt(id), { name: name.trim(), start_date: startDate, currency, tags });
      navigate('/funds');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteFund(parseInt(id));
      navigate('/funds');
    } catch (err) {
      setError('删除失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    );
  }

  if (!fund) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>基金不存在</p>
        <Link to="/funds" style={{ color: 'var(--primary-color)' }}>返回基金列表</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <Link
        to={`/funds/${id}`}
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
        返回基金详情
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
            <Save size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            编辑基金
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            修改 "{fund.name}" 的信息
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

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <Link
              to={`/funds/${id}`}
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
              disabled={saving}
              style={{
                flex: 2,
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {saving ? (
                <>保存中...</>
              ) : (
                <>
                  <Check size={18} />
                  保存修改
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: '1px solid var(--danger-color)',
              background: 'transparent',
              color: 'var(--danger-color)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Trash2 size={18} />
            删除基金
          </button>
        </form>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '420px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: 'var(--danger-color)',
              }}
            >
              <Trash2 size={32} />
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center',
                margin: '0 0 8px 0',
              }}
            >
              确认删除
            </h3>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                margin: '0 0 24px 0',
              }}
            >
              确定要删除基金 "{fund.name}" 吗？此操作无法撤销。
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--danger-color)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
