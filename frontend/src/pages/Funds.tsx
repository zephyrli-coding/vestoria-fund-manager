import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  TrendingUp,
  Eye,
  Filter,
  Download,
  ArrowUpDown,
  Upload
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Fund } from '@/types/api';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export default function Funds() {
  const navigate = useNavigate();
  const { funds, loading, fetchFunds, deleteFund } = useFundStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'nav' | 'balance' | 'date'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<Fund | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleDelete = async () => {
    if (!fundToDelete) return;
    try {
      await deleteFund(fundToDelete.id);
      setDeleteModalOpen(false);
      setFundToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Handle import fund from JSONL
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const content = await file.text();
      
      console.log('Uploading file content length:', content.length);
      
      const response = await fetch(`${API_BASE_URL}/funds/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.code === 0) {
        alert(`导入成功！\n基金名称: ${result.data.fund_name}\n操作数: ${result.data.success}/${result.data.total_operations}`);
        fetchFunds(); // Refresh fund list
      } else {
        alert('导入失败: ' + (result.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert('导入失败: ' + (error?.message || String(error)));
    } finally {
      setImportLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredFunds = funds
    .filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.start_date.includes(searchQuery)
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'nav':
          comparison = a.net_asset_value - b.net_asset_value;
          break;
        case 'balance':
          const rateA = a.currency === 'USD' ? 6.9 : 1;
          const rateB = b.currency === 'USD' ? 6.9 : 1;
          comparison = (a.balance * rateA) - (b.balance * rateB);
          break;
          break;
        case 'date':
          comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
      }
      return sortDesc ? -comparison : comparison;
    });

  const getNavColor = (nav: number) => {
    if (nav >= 1.1) return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' };
    if (nav >= 0.9) return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
    return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}
        >
          基金管理
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          管理您的所有基金，查看详细数据和操作记录
        </p>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              flex: 1,
              maxWidth: '400px',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="搜索基金名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Filter size={18} />
            筛选
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={18} />
            导出
          </button>

          {/* Hidden file input for import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".jsonl,.json,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            onClick={handleImportClick}
            disabled={importLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: importLoading ? 'not-allowed' : 'pointer',
              opacity: importLoading ? 0.6 : 1,
            }}
          >
            <Upload size={18} />
            {importLoading ? '导入中...' : '导入'}
          </button>

          <button
            onClick={() => navigate('/funds/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)';
            }}
          >
            <Plus size={18} />
            创建基金
          </button>
        </div>
      </div>

      {/* Funds Table */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        ) : filteredFunds.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Search size={32} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '16px' }}>
              {searchQuery ? '未找到匹配的基金' : '暂无基金'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/funds/create')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-color)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                创建第一个基金
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {[
                    { key: 'name', label: '基金名称' },
                    { key: 'nav', label: '净值' },
                    { key: 'balance', label: '总资产' },
                    { key: 'shares', label: '总份额' },
                    { key: 'date', label: '成立日期' },
                    { key: 'actions', label: '操作' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (col.key !== 'actions' && col.key !== 'shares') {
                          if (sortBy === col.key) {
                            setSortDesc(!sortDesc);
                          } else {
                            setSortBy(col.key as typeof sortBy);
                            setSortDesc(true);
                          }
                        }
                      }}
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: col.key !== 'actions' && col.key !== 'shares' ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {col.label}
                        {sortBy === col.key && col.key !== 'actions' && col.key !== 'shares' && (
                          <ArrowUpDown
                            size={14}
                            style={{
                              transform: sortDesc ? 'rotate(0deg)' : 'rotate(180deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund, index) => {
                  const navColors = getNavColor(fund.net_asset_value);
                  return (
                    <tr
                      key={fund.id}
                      onClick={() => navigate(`/funds/${fund.id}`)}
                      style={{
                        borderBottom:
                          index < filteredFunds.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {Array.from(fund.name)[0] || '?'}
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 2px 0',
                              }}
                            >
                              {Array.from(fund.name).slice(1).join('') || fund.name}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                              ID: {fund.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '20px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: navColors.bg,
                            color: navColors.text,
                            fontSize: '14px',
                            fontWeight: 600,
                          }}
                        >
                          <TrendingUp size={14} />
                          {fund.net_asset_value.toFixed(4)}
                        </div>
                      </td>

                      <td style={{ padding: '20px' }}>
                        <div>
                          <p
                            style={{
                              fontSize: '15px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              margin: 0,
                            }}
                          >
                            {fund.currency === 'USD' ? '$' : '¥'} {Math.floor(fund.balance).toLocaleString('zh-CN')}
                          </p>
                          {fund.currency === 'USD' && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                              (¥ {Math.floor(fund.balance * 6.9).toLocaleString('zh-CN')})
                            </p>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '20px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                          {Math.floor(fund.total_share).toLocaleString('zh-CN')}
                        </p>
                      </td>

                      <td style={{ padding: '20px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                          {fund.start_date}
                        </p>
                      </td>

                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/funds/${fund.id}`)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary-color)';
                              e.currentTarget.style.color = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/funds/${fund.id}/edit`);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--info-color)';
                              e.currentTarget.style.color = 'var(--info-color)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title="编辑"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFundToDelete(fund);
                              setDeleteModalOpen(true);
                            }}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--danger-color)';
                              e.currentTarget.style.color = 'var(--danger-color)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && fundToDelete && (
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
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: 'var(--shadow-xl)',
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
              确定要删除基金 "{fundToDelete.name}" 吗？此操作无法撤销。
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
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
