import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Activity,
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  Trash2,
  X,
  Check,
  ArrowRightLeft
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Fund, Operation, Investor } from '@/types/api';

export default function FundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchFundById, addInvestor } = useFundStore();
  const store = useFundStore();

  const [fund, setFund] = useState<Fund | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'investors' | 'history'>('overview');

  // Modal states
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);
  const [newInvestorName, setNewInvestorName] = useState('');
  const [adding, setAdding] = useState(false);
  const [investorSearchQuery, setInvestorSearchQuery] = useState('');

  // Invest modal
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  // Redeem modal
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemType, setRedeemType] = useState<'share' | 'balance'>('share');
  const [redeeming, setRedeeming] = useState(false);

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetInvestorId, setTargetInvestorId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState<'share' | 'balance'>('share');
  const [transferring, setTransferring] = useState(false);

  // NAV update modal
  const [showNavModal, setShowNavModal] = useState(false);
  const [navCapital, setNavCapital] = useState('');
  const [updatingNav, setUpdatingNav] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fundData = await fetchFundById(parseInt(id));
        if (fundData) {
          setFund(fundData);
        }
        await loadInvestors();
        await loadOperations(); // 预加载操作历史
      } catch (error) {
        console.error('Failed to load fund:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, fetchFundById]);

  const loadInvestors = async () => {
    if (!id) return;
    try {
      const investorsData = await store.fetchInvestors(parseInt(id));
      setInvestors(investorsData || []);
    } catch (error) {
      console.error('Failed to load investors:', error);
    }
  };

  const loadOperations = async () => {
    if (!id) return;
    try {
      const opsData = await store.fetchOperations(parseInt(id));
      console.log('Loaded operations:', opsData);
      setOperations(opsData || []);
    } catch (error) {
      console.error('Failed to load operations:', error);
      setOperations([]);
    }
  };

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestorName.trim() || !id) return;

    setAdding(true);
    try {
      await addInvestor(parseInt(id), newInvestorName.trim());
      setShowAddInvestorModal(false);
      setNewInvestorName('');
      await loadInvestors();
    } catch (error) {
      console.error('Failed to add investor:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !investAmount || !id) return;

    setInvesting(true);
    try {
      await store.invest(parseInt(id), selectedInvestor.id, parseFloat(investAmount), new Date().toISOString().split('T')[0]);
      setShowInvestModal(false);
      setInvestAmount('');
      setSelectedInvestor(null);
      await loadInvestors();
      await loadOperations();
      // Refresh fund data
      const fundData = await fetchFundById(parseInt(id));
      if (fundData) setFund(fundData);
    } catch (error) {
      console.error('Failed to invest:', error);
    } finally {
      setInvesting(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !redeemAmount || !id) return;

    setRedeeming(true);
    try {
      await store.redeem(parseInt(id), selectedInvestor.id, parseFloat(redeemAmount), redeemType, new Date().toISOString().split('T')[0]);
      setShowRedeemModal(false);
      setRedeemAmount('');
      setSelectedInvestor(null);
      await loadInvestors();
      await loadOperations();
      const fundData = await fetchFundById(parseInt(id));
      if (fundData) setFund(fundData);
    } catch (error) {
      console.error('Failed to redeem:', error);
    } finally {
      setRedeeming(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !targetInvestorId || !transferAmount || !id) return;

    setTransferring(true);
    try {
      await store.transfer(parseInt(id), selectedInvestor.id, parseInt(targetInvestorId), parseFloat(transferAmount), transferType, new Date().toISOString().split('T')[0]);
      setShowTransferModal(false);
      setTransferAmount('');
      setTargetInvestorId('');
      setSelectedInvestor(null);
      await loadInvestors();
      await loadOperations();
    } catch (error) {
      console.error('Failed to transfer:', error);
    } finally {
      setTransferring(false);
    }
  };

  const handleUpdateNav = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navCapital || !id) return;

    setUpdatingNav(true);
    try {
      await store.updateNav(parseInt(id), parseFloat(navCapital), new Date().toISOString().split('T')[0]);
      setShowNavModal(false);
      setNavCapital('');
      const fundData = await fetchFundById(parseInt(id));
      if (fundData) setFund(fundData);
      await loadInvestors();
    } catch (error) {
      console.error('Failed to update NAV:', error);
    } finally {
      setUpdatingNav(false);
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

  const navColors =
    fund.net_asset_value >= 1.1
      ? { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }
      : fund.net_asset_value >= 0.9
      ? { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }
      : { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          to="/funds"
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
          返回基金列表
        </Link>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '8px',
              }}
            >
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                {fund.name}
              </h1>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: navColors.bg,
                  color: navColors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                NAV {fund.net_asset_value.toFixed(4)}
              </div>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
              成立时间: {fund.start_date}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowNavModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Activity size={18} />
              更新净值
            </button>

            <button
              onClick={() => navigate(`/funds/${fund.id}/edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
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
              <Edit3 size={18} />
              编辑基金
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            label: '当前净值',
            value: fund.net_asset_value.toFixed(4),
            icon: Activity,
            color: '#6366f1',
          },
          {
            label: '总资产',
            value: `¥${Math.floor(fund.balance).toLocaleString()}`,
            icon: Wallet,
            color: '#22c55e',
          },
          {
            label: '总份额',
            value: Math.floor(fund.total_share).toLocaleString(),
            icon: TrendingUp,
            color: '#f59e0b',
          },
          {
            label: '投资者',
            value: investors.length.toString(),
            icon: Users,
            color: '#3b82f6',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}
              >
                <stat.icon size={20} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {stat.label}
              </span>
            </div>
            <p
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
        }}
      >
        {[
          { key: 'overview', label: '概览' },
          { key: 'investors', label: '投资者' },
          { key: 'history', label: '操作历史' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as typeof activeTab);
              if (tab.key === 'history') loadOperations();
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === tab.key ? 'var(--primary-color)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
        }}
      >
        {activeTab === 'overview' && (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 20px 0',
              }}
            >
              基金概览
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                  基金 ID
                </p>
                <p
                  style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
                >
                  #{fund.id}
                </p>
              </div>

              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                }}
              >
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                  创建时间
                </p>
                <p
                  style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}
                >
                  {new Date(fund.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investors' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '16px',
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                投资者列表
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                {/* Search Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    maxWidth: '240px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <input
                    type="text"
                    value={investorSearchQuery}
                    onChange={(e) => setInvestorSearchQuery(e.target.value)}
                    placeholder="搜索投资者..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      width: '120px',
                    }}
                  />
                  {investorSearchQuery && (
                    <button
                      onClick={() => setInvestorSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowAddInvestorModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                  添加投资者
                </button>
              </div>
            </div>

            {investors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ marginBottom: '12px', opacity: 0.5 }}></Users>
                <p>暂无投资者</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {investors
                  .filter(inv => inv.name.toLowerCase().includes(investorSearchQuery.toLowerCase()))
                  .map((investor) => (
                    <div
                      key={investor.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                      }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {investor.name.charAt(0)}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {investor.name}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          加入时间: {new Date(investor.created_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      {/* Share and Balance - Equal size, side by side */}
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              fontSize: '20px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: '0 0 4px 0',
                            }}
                          >
                            {Math.floor(investor.share).toLocaleString()} 份
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            持有份额
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              fontSize: '20px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: '0 0 4px 0',
                            }}
                          >
                            ¥{Math.floor(investor.balance).toLocaleString()}
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            资产价值
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setShowInvestModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#22c55e',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          申购
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setShowRedeemModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          赎回
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvestor(investor);
                            setShowTransferModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          转账
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 20px 0',
              }}
            >
              操作历史
            </h3>

            {operations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Clock size={40} style={{ marginBottom: '12px', opacity: 0.5 }}></Clock>
                <p>暂无操作记录</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {operations.map((op) => (
                  <div
                    key={op.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background:
                          op.operation_type === 'invest'
                            ? 'rgba(34, 197, 94, 0.1)'
                            : op.operation_type === 'redeem'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : op.operation_type === 'transfer'
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color:
                          op.operation_type === 'invest'
                            ? '#22c55e'
                            : op.operation_type === 'redeem'
                            ? '#ef4444'
                            : op.operation_type === 'transfer'
                            ? '#3b82f6'
                            : '#f59e0b',
                      }}
                    >
                      {op.operation_type === 'invest' ? (
                        <TrendingUp size={20} />
                      ) : op.operation_type === 'redeem' ? (
                        <TrendingDown size={20} />
                      ) : op.operation_type === 'transfer' ? (
                        <ArrowRightLeft size={20} />
                      ) : (
                        <Activity size={20} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: '0 0 2px 0',
                        }}
                      >
                        {op.operation_type === 'invest'
                          ? '申购'
                          : op.operation_type === 'redeem'
                          ? '赎回'
                          : op.operation_type === 'transfer'
                          ? '转账'
                          : op.operation_type === 'update_nav'
                          ? '净值更新'
                          : op.operation_type === 'add_investor'
                          ? '添加投资者'
                          : op.operation_type}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                        {new Date(op.operation_date).toLocaleString('zh-CN')}
                      </p>
                      {op.share && op.share > 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                          份额: {Math.floor(op.share).toLocaleString()} 份
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {op.amount ? (
                        <p
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color:
                              op.operation_type === 'invest'
                                ? '#22c55e'
                                : op.operation_type === 'redeem'
                                ? '#ef4444'
                                : 'var(--text-primary)',
                            margin: '0 0 2px 0',
                          }}
                        >
                          {op.operation_type === 'invest' ? '+' : '-'}
                          ¥{Math.floor(op.amount).toLocaleString()}
                        </p>
                      ) : op.nav_before && op.nav_after ? (
                        <p
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '0 0 2px 0',
                          }}
                        >
                          {op.nav_before.toFixed(4)} → {op.nav_after.toFixed(4)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Investor Modal */}
      {showAddInvestorModal && (
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
          onClick={() => setShowAddInvestorModal(false)}
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
                  <Users size={20} color="var(--text-muted)" />
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
                  onClick={() => setShowAddInvestorModal(false)}
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

      {/* Invest Modal */}
      {showInvestModal && selectedInvestor && (
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
          onClick={() => setShowInvestModal(false)}
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
                margin: '0 0 8px 0',
              }}
            >
              申购份额
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              投资者: {selectedInvestor.name} | 当前NAV: {fund?.net_asset_value.toFixed(4)}
            </p>

            <form onSubmit={handleInvest}>
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
                  申购金额 (¥) *
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
                  <Wallet size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="请输入申购金额"
                    min="0.01"
                    step="0.01"
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
                {investAmount && fund && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    预计获得份额: {(parseFloat(investAmount) / fund.net_asset_value).toFixed(4)} 份
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowInvestModal(false)}
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
                  disabled={investing}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#22c55e',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: investing ? 'not-allowed' : 'pointer',
                    opacity: investing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {investing ? '处理中...' : <><TrendingUp size={16} /> 确认申购</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && selectedInvestor && (
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
          onClick={() => setShowRedeemModal(false)}
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
                margin: '0 0 8px 0',
              }}
            >
              赎回份额
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              投资者: {selectedInvestor.name} | 当前持有: {selectedInvestor.share.toFixed(4)} 份
            </p>

            <form onSubmit={handleRedeem}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  赎回类型
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRedeemType('share')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: redeemType === 'share' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                      background: redeemType === 'share' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
                      color: redeemType === 'share' ? '#ef4444' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    按份额
                  </button>
                  <button
                    type="button"
                    onClick={() => setRedeemType('balance')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: redeemType === 'balance' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                      background: redeemType === 'balance' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
                      color: redeemType === 'balance' ? '#ef4444' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    按金额
                  </button>
                </div>
              </div>

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
                  {redeemType === 'share' ? '赎回份额' : '赎回金额 (¥)'} *
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
                  <TrendingDown size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={redeemType === 'share' ? '请输入赎回份额' : '请输入赎回金额'}
                    min="0.01"
                    step="0.01"
                    max={redeemType === 'share' ? selectedInvestor.share : selectedInvestor.balance}
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
                {redeemAmount && fund && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {redeemType === 'share'
                      ? `预计获得金额: ¥${(parseFloat(redeemAmount) * fund.net_asset_value).toFixed(2)}`
                      : `预计赎回份额: ${(parseFloat(redeemAmount) / fund.net_asset_value).toFixed(4)} 份`}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
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
                  disabled={redeeming}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: redeeming ? 'not-allowed' : 'pointer',
                    opacity: redeeming ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {redeeming ? '处理中...' : <><TrendingDown size={16} /> 确认赎回</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedInvestor && (
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
          onClick={() => setShowTransferModal(false)}
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
                margin: '0 0 8px 0',
              }}
            >
              份额转账
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              转出方: {selectedInvestor.name} | 当前持有: {selectedInvestor.share.toFixed(4)} 份
            </p>

            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  转账类型
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setTransferType('share')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: transferType === 'share' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      background: transferType === 'share' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                      color: transferType === 'share' ? '#3b82f6' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    按份额
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('balance')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: transferType === 'balance' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      background: transferType === 'balance' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                      color: transferType === 'balance' ? '#3b82f6' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    按金额
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  转入方 *
                </label>
                <select
                  value={targetInvestorId}
                  onChange={(e) => setTargetInvestorId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  required
                >
                  <option value="">请选择转入方</option>
                  {investors
                    .filter((inv) => inv.id !== selectedInvestor.id)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (当前: {inv.share.toFixed(4)} 份)
                      </option>
                    ))}
                </select>
              </div>

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
                  {transferType === 'share' ? '转账份额' : '转账金额 (¥)'} *
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
                  <ArrowRightLeft size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder={transferType === 'share' ? '请输入转账份额' : '请输入转账金额'}
                    min="0.01"
                    step="0.01"
                    max={transferType === 'share' ? selectedInvestor.share : selectedInvestor.balance}
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
                {transferAmount && fund && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {transferType === 'share'
                      ? `相当于金额: ¥${(parseFloat(transferAmount) * fund.net_asset_value).toFixed(2)}`
                      : `相当于份额: ${(parseFloat(transferAmount) / fund.net_asset_value).toFixed(4)} 份`}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
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
                  disabled={transferring}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: transferring ? 'not-allowed' : 'pointer',
                    opacity: transferring ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {transferring ? '处理中...' : <><ArrowRightLeft size={16} /> 确认转账</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update NAV Modal */}
      {showNavModal && (
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
          onClick={() => setShowNavModal(false)}
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
                margin: '0 0 8px 0',
              }}
            >
              更新净值
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              当前NAV: {fund?.net_asset_value.toFixed(4)} | 当前总资产: ¥{fund?.balance.toLocaleString()}
            </p>

            <form onSubmit={handleUpdateNav}>
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
                  新总资产 (¥) *
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
                  <Activity size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={navCapital}
                    onChange={(e) => setNavCapital(e.target.value)}
                    placeholder="请输入新总资产"
                    min="0.01"
                    step="0.01"
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
                {navCapital && fund && fund.total_share > 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    新NAV: {(parseFloat(navCapital) / fund.total_share).toFixed(4)}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNavModal(false)}
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
                  disabled={updatingNav}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: updatingNav ? 'not-allowed' : 'pointer',
                    opacity: updatingNav ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {updatingNav ? '更新中...' : <><Activity size={16} /> 确认更新</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
