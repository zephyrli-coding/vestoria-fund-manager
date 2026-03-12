import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  PieChart
} from 'lucide-react';
import { useFundStore } from '@/stores/fund';
import type { Fund, Operation } from '@/types/api';

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

interface FundCardProps {
  fund: Fund;
}

function FundCard({ fund }: FundCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/funds/${fund.id}`)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      className="hover-lift"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            {fund.name}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            成立时间: {fund.start_date}
          </p>
        </div>
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background:
              fund.net_asset_value >= 1
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            color:
              fund.net_asset_value >= 1 ? 'var(--success-color)' : 'var(--warning-color)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          NAV {fund.net_asset_value.toFixed(4)}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            总资产
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            ¥{fund.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            总份额
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {fund.total_share.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { funds, loading, fetchFunds } = useFundStore();
  const [recentOperations] = useState<Operation[]>([
    {
      id: 1,
      fund_id: 1,
      investor_id: 1,
      operation_type: 'invest',
      operation_date: '2024-03-12',
      amount: 10000,
      amount_type: 'balance',
      share: 1000,
      nav_before: 1.0,
      nav_after: 1.0,
      total_share_before: 0,
      total_share_after: 1000,
      balance_before: 0,
      balance_after: 10000,
      transfer_from_id: null,
      transfer_to_id: null,
      created_at: '2024-03-12T10:30:00',
    },
    {
      id: 2,
      fund_id: 1,
      investor_id: 2,
      operation_type: 'redeem',
      operation_date: '2024-03-11',
      amount: 5000,
      amount_type: 'balance',
      share: 500,
      nav_before: 1.2,
      nav_after: 1.2,
      total_share_before: 2000,
      total_share_after: 1500,
      balance_before: 24000,
      balance_after: 18000,
      transfer_from_id: null,
      transfer_to_id: null,
      created_at: '2024-03-11T14:20:00',
    },
    {
      id: 3,
      fund_id: 1,
      investor_id: null,
      operation_type: 'update_nav',
      operation_date: '2024-03-10',
      amount: null,
      amount_type: null,
      share: null,
      nav_before: 1.0,
      nav_after: 1.2,
      total_share_before: 2000,
      total_share_after: 2000,
      balance_before: 20000,
      balance_after: 24000,
      transfer_from_id: null,
      transfer_to_id: null,
      created_at: '2024-03-10T09:00:00',
    },
  ]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  // Calculate totals
  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  const totalShares = funds.reduce((sum, f) => sum + f.total_share, 0);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'invest':
        return { icon: TrendingUp, color: 'var(--success-color)', label: '申购' };
      case 'redeem':
        return { icon: TrendingDown, color: 'var(--danger-color)', label: '赎回' };
      case 'update_nav':
        return { icon: Activity, color: 'var(--info-color)', label: 'NAV更新' };
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

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          title="总资产"
          value={`¥${totalBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
          change="+12.5%"
          changePositive={true}
          icon={Wallet}
          color="#6366f1"
        />
        <StatCard
          title="总份额"
          value={totalShares.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          change="+8.3%"
          changePositive={true}
          icon={PieChart}
          color="#22c55e"
        />
        <StatCard
          title="基金数量"
          value={funds.length.toString()}
          icon={Activity}
          color="#f59e0b"
        />
        <StatCard
          title="投资者数"
          value="12"
          icon={Users}
          color="#3b82f6"
        />
      </div>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {funds.slice(0, 4).map((fund) => (
                <FundCard key={fund.id} fund={fund} />
              ))}
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
                        }}
                      >
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
          </div>
        </div>
      </div>
    </div>
  );
}
