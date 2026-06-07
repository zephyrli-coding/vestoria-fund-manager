import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Activity,
  ArrowRight,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Fund, Operation, ChartData } from '@/types/api';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, changePositive, icon: Icon, color }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        transition: 'all 0.3s ease',
      }}
      className="hover-lift"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              fontWeight: 500,
            }}
          >
            {title}
          </p>
          <h3
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {value}
          </h3>
          {change && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: changePositive ? 'var(--success-color)' : 'var(--danger-color)',
              }}
            >
              {changePositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{change}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>较上月</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}
        >
          <Icon size={26} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  useDocumentTitle('Vestoria - 仪表盘');
  const { funds, loading, fetchFunds, fetchRecentOperations, fetchTagChartData } = useFundStore();
  const [selectedTag, setSelectedTag] = useState('');
  const [recentOperations, setRecentOperations] = useState<Operation[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [tagChartDataCNY, setTagChartDataCNY] = useState<ChartData[]>([]);
  const [tagChartDataUSD, setTagChartDataUSD] = useState<ChartData[]>([]);
  const [chartCurrency, setChartCurrency] = useState<'CNY' | 'USD'>('CNY');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  useEffect(() => {
    const loadOps = async () => {
      setOpsLoading(true);
      try {
        const ops = await fetchRecentOperations(10);
        setRecentOperations(ops);
      } catch (error) {
        console.error('Failed to load recent operations:', error);
      } finally {
        setOpsLoading(false);
      }
    };
    loadOps();
  }, [fetchRecentOperations]);

  // Load aggregate chart data when tag changes
  useEffect(() => {
    const loadChart = async () => {
      setChartLoading(true);
      try {
        const data = await fetchTagChartData(selectedTag || undefined);
        setTagChartDataCNY(data?.balance || []);
        // @ts-ignore — backend returns balance_usd but type doesn't include it yet
        setTagChartDataUSD(data?.balance_usd || []);
      } catch (error) {
        console.error('Failed to load chart data:', error);
        setTagChartDataCNY([]);
        setTagChartDataUSD([]);
      } finally {
        setChartLoading(false);
      }
    };
    loadChart();
  }, [fetchTagChartData, selectedTag]);

  const currentChartData = chartCurrency === 'CNY' ? tagChartDataCNY : tagChartDataUSD;
  const currencySymbol = chartCurrency === 'CNY' ? '¥' : '$';

  // Extract all unique tags (from all funds, before filtering)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    funds.forEach((fund) => {
      if (fund.tags) {
        fund.tags.split(',').forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [funds]);

  // Filter funds by selected tag
  const filteredFunds = useMemo(() => {
    if (!selectedTag) return funds;
    return funds.filter((f) => f.tags && f.tags.split(',').map((t) => t.trim()).includes(selectedTag));
  }, [funds, selectedTag]);

  // Calculate totals from filtered funds
  const totalBalanceCNY = filteredFunds.reduce((sum, f) => sum + (f.currency === 'USD' ? f.balance * 6.9 : f.balance), 0);
  const totalBalanceUSD = filteredFunds.reduce((sum, f) => sum + (f.currency === 'USD' ? f.balance : f.balance / 6.9), 0);
  const totalInvestorCount = filteredFunds.reduce((sum, f) => sum + (f.investor_count || 0), 0);

  // Fund name lookup for operations
  const fundNameMap = useMemo(() => {
    const map = new Map<number, string>();
    funds.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [funds]);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'invest':
        return { icon: TrendingUp, color: 'var(--success-color)', label: '申购' };
      case 'redeem':
        return { icon: TrendingDown, color: 'var(--danger-color)', label: '赎回' };
      case 'transfer':
        return { icon: ArrowRightLeft, color: '#3b82f6', label: '转账' };
      case 'update_nav':
        return { icon: Activity, color: 'var(--info-color)', label: 'NAV更新' };
      case 'add_investor':
        return { icon: Users, color: '#8b5cf6', label: '添加投资者' };
      default:
        return { icon: Activity, color: 'var(--text-muted)', label: type };
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px',
            }}
          >
            仪表盘
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
            欢迎回来，查看您的基金投资概况
          </p>
        </div>

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

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => setSelectedTag('')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: selectedTag === '' ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: selectedTag === '' ? 'white' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedTag === tag ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Total Assets Card - Custom with CNY and USD */}
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease',
          }}
          className="hover-lift"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                总资产
              </p>
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                ¥ {Math.floor(totalBalanceCNY).toLocaleString('zh-CN')}
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  margin: '4px 0 0 0',
                }}
              >
                $ {Math.floor(totalBalanceUSD).toLocaleString('zh-CN')}
              </p>
            </div>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#6366f115',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
              }}
            >
              <Wallet size={26} />
            </div>
          </div>
        </div>

        <StatCard
          title="基金数量"
          value={filteredFunds.length.toString()}
          icon={Activity}
          color="#f59e0b"
        />
        <StatCard
          title="投资者数"
          value={totalInvestorCount.toString()}
          icon={Users}
          color="#3b82f6"
        />
      </div>

      {/* Aggregate Balance Chart */}
      {currentChartData.length > 1 && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
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
              {selectedTag ? `#${selectedTag} 总资产走势` : '总资产走势'}
            </h3>
            <button
              onClick={() => setChartCurrency((c) => (c === 'CNY' ? 'USD' : 'CNY'))}
              title={`切换为 ${chartCurrency === 'CNY' ? 'USD' : 'CNY'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <DollarSign size={14} />
              {chartCurrency}
            </button>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  tickFormatter={(value: string) => value.slice(5)}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  tickFormatter={(value: number) =>
                    value >= 10000
                      ? `${Math.floor(value / 10000)}万`
                      : `${Math.floor(value)}`
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '13px',
                  }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(value: number) => [
                    `${currencySymbol}${Math.floor(value).toLocaleString('zh-CN')}`,
                    '总资产'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left Column - Funds */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              我的基金
            </h2>
            <Link
              to="/funds"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              查看全部
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              加载中...
            </div>
          ) : funds.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '60px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
              }}
            >
              <Wallet size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                暂无基金，开始创建您的第一个基金吧
              </p>
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
                创建基金
              </button>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredFunds.map((fund, index) => {
                  const navColor = fund.net_asset_value >= 1
                    ? { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }
                    : { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
                  const tags = fund.tags
                    ? fund.tags.split(',').map((t) => t.trim()).filter((t) => t)
                    : [];
                  return (
                    <div
                      key={fund.id}
                      onClick={() => navigate(`/funds/${fund.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 20px',
                        cursor: 'pointer',
                        borderBottom:
                          index < filteredFunds.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Icon */}
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
                          fontSize: '16px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {Array.from(fund.name)[0] || '?'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {fund.name}
                          </span>
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                fontWeight: 500,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          成立 {fund.start_date}
                        </span>
                      </div>

                      {/* NAV badge */}
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: '16px',
                          background: navColor.bg,
                          color: navColor.text,
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        NAV {fund.net_asset_value.toFixed(4)}
                      </div>

                      {/* Balance */}
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '100px' }}>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {fund.currency === 'USD' ? '$' : '¥'}
                          {Math.floor(fund.balance).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Recent Activity */}
        <div>
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              height: 'fit-content',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
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
                最近操作
              </h3>
              <Calendar size={18} color="var(--text-muted)" />
            </div>

            {opsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                加载中...
              </div>
            ) : recentOperations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Clock size={40} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>暂无操作记录</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentOperations.map((op) => {
                  const { icon: Icon, color, label } = getOperationIcon(op.operation_type);
                  return (
                    <div
                      key={op.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
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
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: '0 0 2px 0',
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={fundNameMap.get(op.fund_id || 0)}
                        >
                          {fundNameMap.get(op.fund_id || 0) || ''}
                          {fundNameMap.get(op.fund_id || 0) && ' · '}
                          {new Date(op.operation_date).toLocaleDateString('zh-CN')}
                        </p>
                      </div>

                      {op.amount && (
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color:
                              op.operation_type === 'invest'
                                ? 'var(--success-color)'
                                : 'var(--danger-color)',
                          }}
                        >
                          {op.operation_type === 'invest' ? '+' : '-'}
                          ¥{op.amount?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
