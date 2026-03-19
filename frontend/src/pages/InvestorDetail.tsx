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
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
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
  const [loading, setLoading] = useState(true);

  // 计算累计收益
  const calculateTotalReturn = () => {
    if (!investor || !fund) return 0;
    return investor.share * fund.net_asset_value + investor.total_redeemed - investor.total_invested;
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
        await loadReturnHistory();
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, investorId, fetchFundById, fetchInvestors]);

  const loadReturnHistory = async () => {
    if (!id || !investorId) return;
    try {
      const response = await fetch(apiUrl(`/funds/${id}/investors/${investorId}/return-history`));
      const result = await response.json();
      if (result.code === 0 && result.data?.snapshots) {
        setReturnHistory(result.data.snapshots);
      }
    } catch (error) {
      console.error('Failed to load return history:', error);
    }
  };

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
                color: stat.label === '累计收益' ? stat.color : 'var(--text-primary)',
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
  );
}
