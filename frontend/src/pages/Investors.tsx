import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  Wallet,
  PieChart,
  TrendingUp,
  MoreHorizontal,
  Edit3,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Investor, Fund } from '@/types/api';

export default function Investors() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchFundById, fetchInvestors, addInvestor, investors, currentFund, loading: storeLoading } = useFundStore();

  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvestorName, setNewInvestorName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fundData = await fetchFundById(parseInt(id));
        if (fundData) {
          setFund(fundData);
        }
        await fetchInvestors(parseInt(id));
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, fetchFundById, fetchInvestors]);

  const filteredInvestors = investors.filter((inv) =>
    inv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestorName.trim() || !id) return;
    
    setAdding(true);
    try {
      await addInvestor(parseInt(id), newInvestorName.trim());
      setShowAddModal(false);
      setNewInvestorName('');
      // 重新获取投资者列表
      await fetchInvestors(parseInt(id));
    } catch (error) {
      console.error('Failed to add investor:', error);
    } finally {
      setAdding(false);
    }
  };

  if (loading || storeLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    );
  }

  const displayFund = fund || currentFund;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        {id ? (
          <>
            <Link
              to={`/funds/${id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              <ArrowLeft size={16} />
              返回基金详情
            </Link>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              {displayFund?.name || '基金'} - 投资者
            </h1>
          </>
        ) : (
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            投资者管理
          </h1>
        )}
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          管理基金投资者，查看持仓和交易记录
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
              placeholder="搜索投资者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {id && (
          <button
            onClick={() => setShowAddModal(true)}
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
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Plus size={18} />
            添加投资者
          </button>
        )}
      </div>

      {/* Investors Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredInvestors.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '80px',
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
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
              <User size={32} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              {searchQuery ? '未找到匹配的投资者' : '暂无投资者'}
            </p>
            {id && !searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  marginTop: '16px',
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
                添加第一个投资者
              </button>
            )}
          </div>
        ) : (
          filteredInvestors.map((investor) => (
            <div
              key={investor.id}
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
              }}
              className="hover-lift"
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 600,
                    }}
                  >
                    {investor.name.charAt(0)}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: '0 0 2px 0',
                      }}
                    >
                      {investor.name}
                    </h3>
                    <p
                      style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}
                    >
                      ID: {investor.id}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--danger-color)',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <PieChart size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      持有份额
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {investor.share?.toFixed(4) || '0.0000'}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <Wallet size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      资产价值
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    ¥{investor.balance?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <TrendingUp size={14} color="var(--success-color)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      累计收益
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: (investor.share * (fund?.net_asset_value || 0) + investor.total_redeemed - investor.total_invested) >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                      margin: 0,
                    }}
                  >
                    {(() => {
                      const totalReturn = (investor.share * (fund?.net_asset_value || 0) + investor.total_redeemed - investor.total_invested);
                      return `${totalReturn >= 0 ? '+' : ''}¥${totalReturn.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* 投入/赎回详情 */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>投入: ¥{investor.total_invested?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}</span>
                <span>赎回: ¥{investor.total_redeemed?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Investor Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
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
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 20px 0',
              }}
            >
              添加投资者
            </h3>

            <form onSubmit={handleAddInvestor}>
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
                  投资者姓名 *
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
                  <User size={20} color="var(--text-muted)" />
                  <input
                    type="text"
                    value={newInvestorName}
                    onChange={(e) => setNewInvestorName(e.target.value)}
                    placeholder="请输入投资者姓名"
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '15px',
                      color: 'var(--text-primary)',
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  type="submit"
                  disabled={adding}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: adding ? 'not-allowed' : 'pointer',
                    opacity: adding ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {adding ? '添加中...' : <><Check size={16} /> 确认添加</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
