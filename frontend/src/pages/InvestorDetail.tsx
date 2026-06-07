import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  User,
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import { apiUrl } from '@/config/api';
import type { Fund, Investor } from '@/types/api';

// 货币格式化工具
const formatMoney = (amount: number, currency: 'CNY' | 'USD' = 'CNY') => {
  const symbol = currency === 'USD' ? '$' : '¥';
  return `${symbol}${Math.abs(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface InvestorReturnSnapshot {
  id: number;
  investor_id: number;
  fund_id: number;
  date: string;
  nav: number;
  share: number;
  total_invested: number;
  total_redeemed: number;
  total_return: number;
  created_at: string;
}

export default function InvestorDetail() {
  const { id, investorId } = useParams<{ id: string; investorId: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Vestoria - 投资者详情');
  const { fetchFundById, fetchInvestors } = useFundStore();

  const [fund, setFund] = useState<Fund | null>(null);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [returnHistory, setReturnHistory] = useState<InvestorReturnSnapshot[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invest modal
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investDate, setInvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [investing, setInvesting] = useState(false);

  // Redeem modal
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemType, setRedeemType] = useState<'share' | 'balance'>('share');
  const [redeemDate, setRedeemDate] = useState(new Date().toISOString().split('T')[0]);
  const [redeeming, setRedeeming] = useState(false);

  // 计算累计收益
  const calculateTotalReturn = () => {
    if (!investor || !fund) return 0;
    return investor.share * fund.net_asset_value + investor.total_redeemed - investor.total_invested;
  };

  // 计算收益率
  const calculateReturnRate = () => {
    if (!investor || !fund || investor.total_invested <= 0) return 0;
    const totalReturn = calculateTotalReturn();
    return (totalReturn / investor.total_invested) * 100;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id || !investorId) return;
      setLoading(true);
      try {
        // 加载基金数据
        const fundData = await fetchFundById(parseInt(id));
        if (fundData) {
          setFund(fundData);
        }

        // 加载投资者数据
        const investorsData = await fetchInvestors(parseInt(id));
        const currentInvestor = investorsData?.find((inv: Investor) => inv.id === parseInt(investorId));
        if (currentInvestor) {
          setInvestor(currentInvestor);
        }

        // 加载收益历史
        try {
          const response = await fetch(apiUrl(`/funds/${id}/investors/${investorId}/return-history`));
          const result = await response.json();
          if (result.code === 0 && result.data?.snapshots) {
            setReturnHistory(result.data.snapshots);
          }
        } catch (error) {
          console.error('Failed to load return history:', error);
        }

        // 加载操作历史
        try {
          const response = await fetch(apiUrl(`/funds/${id}/investors/${investorId}/operations`));
          const result = await response.json();
          if (result.code === 0 && result.data?.items) {
            setOperations(result.data.items);
          }
        } catch (error) {
          console.error('Failed to load operations:', error);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, investorId, fetchFundById, fetchInvestors]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    );
  }

  if (!investor || !fund) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>投资者不存在</p>
        <Link to={`/funds/${id}`} style={{ color: 'var(--primary-color)' }}>返回基金详情</Link>
      </div>
    );
  }

  const totalReturn = calculateTotalReturn();
  const isProfit = totalReturn >= 0;
  const returnRate = calculateReturnRate();

  // 收益曲线数据
  const chartData = returnHistory.map((snapshot) => ({
    date: snapshot.date,
    return: snapshot.total_return,
    nav: snapshot.nav,
    share: snapshot.share,
  }));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '28px',
                fontWeight: 700,
              }}
            >
              {Array.from(investor.name)[0] || '?'}
            </div>
            <div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0',
                }}
              >
                {investor.name}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                {fund.name} · 投资者ID: #{investor.id}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowInvestModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: '#22c55e',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <TrendingUp size={18} />
              申购
            </button>
            <button
              onClick={() => setShowRedeemModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <TrendingDown size={18} />
              赎回
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            label: '持有份额',
            value: Math.floor(investor.share).toLocaleString(),
            icon: PieChart,
            color: '#6366f1',
          },
          {
            label: '资产价值',
            value: `${fund.currency === 'USD' ? '$' : '¥'}${Math.floor(investor.balance).toLocaleString()}`,
            icon: Wallet,
            color: '#3b82f6',
          },
          {
            label: '累计收益',
            value: `${isProfit ? '+' : ''}${fund.currency === 'USD' ? '$' : '¥'}${Math.floor(totalReturn).toLocaleString()}`,
            icon: isProfit ? TrendingUp : TrendingDown,
            color: isProfit ? '#22c55e' : '#ef4444',
          },
          {
            label: '收益率',
            value: `${isProfit ? '+' : ''}${returnRate.toFixed(2)}%`,
            icon: isProfit ? TrendingUp : TrendingDown,
            color: isProfit ? '#22c55e' : '#ef4444',
          },
          {
            label: '累计投入',
            value: `${fund.currency === 'USD' ? '$' : '¥'}${Math.floor(investor.total_invested).toLocaleString()}`,
            icon: Activity,
            color: '#f59e0b',
          },
          {
            label: '累计赎回',
            value: `${fund.currency === 'USD' ? '$' : '¥'}${Math.floor(investor.total_redeemed).toLocaleString()}`,
            icon: Activity,
            color: '#8b5cf6',
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
                fontSize: '20px',
                fontWeight: 700,
                color: ['累计收益', '收益率'].includes(stat.label) ? stat.color : 'var(--text-primary)',
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Return Chart */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={20} />
          收益曲线
        </h3>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={12}
                tickFormatter={(value) => `¥${Math.round(value).toLocaleString('zh-CN')}`}
                domain={(() => {
                  const values = chartData.map(d => d.return);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  return [min * 0.95, max * 1.05];
                })()}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'return') return [`¥${value.toFixed(2)}`, '累计收益'];
                  return [value, name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('zh-CN')}
              />
              <Line
                type="monotone"
                dataKey="return"
                stroke={isProfit ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={chartData.length > 10 ? false : { fill: isProfit ? '#22c55e' : '#ef4444', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: isProfit ? '#22c55e' : '#ef4444', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            暂无收益历史数据
          </div>
        )}
      </div>

      {/* Operation History */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={20} />
          操作历史
        </h3>

        {operations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>暂无操作记录</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {operations.map((op: any) => {
              const getOpIcon = (type: string) => {
                switch (type) {
                  case 'invest': return { icon: TrendingUp, color: '#22c55e', label: '申购' };
                  case 'redeem': return { icon: TrendingDown, color: '#ef4444', label: '赎回' };
                  case 'transfer': return { icon: ArrowRightLeft, color: '#3b82f6', label: '转账' };
                  case 'update_nav': return { icon: Activity, color: '#f59e0b', label: 'NAV更新' };
                  case 'add_investor': return { icon: User, color: '#8b5cf6', label: '添加投资者' };
                  default: return { icon: Activity, color: 'var(--text-muted)', label: type };
                }
              };
              const { icon: Icon, color, label } = getOpIcon(op.operation_type);
              return (
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
                      background: `${color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: '0 0 2px 0',
                      }}
                    >
                      {label}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {new Date(op.operation_date).toLocaleDateString('zh-CN')}
                    </p>
                    {op.share && op.share > 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        份额: {Math.floor(op.share).toLocaleString()} 份
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {op.amount ? (
                      <p
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: op.operation_type === 'invest' ? '#22c55e' : '#ef4444',
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
              );
            })}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <User size={16} />
            基本信息
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>投资者姓名</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {investor.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>加入时间</span>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {new Date(investor.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>当前净值</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {fund.net_asset_value.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calendar size={16} />
            最新快照
          </h4>
          {returnHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const latest = returnHistory[returnHistory.length - 1];
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>快照日期</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{latest.date}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>当时份额</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{Math.floor(latest.share).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>当时累计收益</span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: latest.total_return >= 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {latest.total_return >= 0 ? '+' : '-'}{fund.currency === 'USD' ? '$' : '¥'}{Math.abs(Math.floor(latest.total_return)).toLocaleString()}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              暂无快照数据
            </p>
          )}
        </div>
      </div>
    </div>

      {/* Invest Modal */}
      {showInvestModal && (
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
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              申购份额
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              投资者: {investor.name} | 当前NAV: {fund.net_asset_value.toFixed(4)}
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!investAmount || !id || !investorId) return;
              setInvesting(true);
              try {
                await fetch(apiUrl(`/funds/${id}/investors/${investorId}/invest`), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ amount: parseFloat(investAmount), date: investDate }),
                });
                setShowInvestModal(false);
                setInvestAmount('');
                window.location.reload();
              } catch (err) {
                console.error('Invest failed:', err);
              } finally {
                setInvesting(false);
              }
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  申购金额 ({fund.currency === 'USD' ? '$' : '¥'}) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <Wallet size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="请输入申购金额"
                    min="0.01"
                    step="0.01"
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: 'var(--text-primary)' }}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  申购日期 *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <Calendar size={20} color="var(--text-muted)" />
                  <input
                    type="date"
                    value={investDate}
                    onChange={(e) => setInvestDate(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowInvestModal(false)} style={{ flex: 1, padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit" disabled={investing} style={{ flex: 1, padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', fontSize: '14px', fontWeight: 600, cursor: investing ? 'not-allowed' : 'pointer', opacity: investing ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {investing ? '处理中...' : <><Check size={16} /> 确认申购</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Modal */}
      {showRedeemModal && (
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
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              赎回份额
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              投资者: {investor.name} | 当前持有: {Math.floor(investor.share).toLocaleString()} 份
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!redeemAmount || !id || !investorId) return;
              setRedeeming(true);
              try {
                await fetch(apiUrl(`/funds/${id}/investors/${investorId}/redeem`), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ amount: parseFloat(redeemAmount), amount_type: redeemType, date: redeemDate }),
                });
                setShowRedeemModal(false);
                setRedeemAmount('');
                window.location.reload();
              } catch (err) {
                console.error('Redeem failed:', err);
              } finally {
                setRedeeming(false);
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  赎回类型
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRedeemType('share')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: redeemType === 'share' ? '2px solid #ef4444' : '1px solid var(--border-color)', background: redeemType === 'share' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', color: redeemType === 'share' ? '#ef4444' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    按份额
                  </button>
                  <button
                    type="button"
                    onClick={() => setRedeemType('balance')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: redeemType === 'balance' ? '2px solid #ef4444' : '1px solid var(--border-color)', background: redeemType === 'balance' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', color: redeemType === 'balance' ? '#ef4444' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    按金额
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {redeemType === 'share' ? '赎回份额' : `赎回金额 (${fund.currency === 'USD' ? '$' : '¥'})`} *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <TrendingDown size={20} color="var(--text-muted)" />
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={redeemType === 'share' ? '请输入赎回份额' : '请输入赎回金额'}
                    min="0.01"
                    step="0.01"
                    max={redeemType === 'share' ? investor.share : investor.balance}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: 'var(--text-primary)' }}
                    required
                    autoFocus
                  />
                </div>
                {redeemAmount && fund && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {redeemType === 'share'
                      ? `预计获得金额: ${fund.currency === 'USD' ? '$' : '¥'}${(parseFloat(redeemAmount) * fund.net_asset_value).toFixed(2)}`
                      : `预计赎回份额: ${(parseFloat(redeemAmount) / fund.net_asset_value).toFixed(4)} 份`}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  赎回日期 *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <Calendar size={20} color="var(--text-muted)" />
                  <input
                    type="date"
                    value={redeemDate}
                    onChange={(e) => setRedeemDate(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowRedeemModal(false)} style={{ flex: 1, padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  取消
                </button>
                <button type="submit" disabled={redeeming} style={{ flex: 1, padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 600, cursor: redeeming ? 'not-allowed' : 'pointer', opacity: redeeming ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {redeeming ? '处理中...' : <><TrendingDown size={16} /> 确认赎回</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  );
}
