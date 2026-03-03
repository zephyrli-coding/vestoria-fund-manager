import { Card, Row, Col, Statistic, Typography, Button, Space } from 'antd';
import {
  DollarOutlined,
  FundOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      title: '总资产',
      value: '¥0.00',
      icon: <DollarOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: '总份额',
      value: '0.00',
      icon: <FundOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      trend: '+8.3%',
      trendUp: true,
    },
    {
      title: '总投资者',
      value: '0',
      icon: <UserOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
  ];

  const recentOperations = [
    { type: '申购', investor: 'Alice', amount: '+1000.00', time: '10:30' },
    { type: '赎回', investor: 'Bob', amount: '-500.00', time: '10:25' },
    { type: 'NAV 更新', investor: '-', amount: '1.5', time: '09:00' },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        仪表盘
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} lg={6} key={index}>
            <Card
              bordered={false}
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
              <div style={{ marginTop: '12px' }}>
                {stat.trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {stat.trendUp ? (
                      <ArrowUpOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
                    ) : (
                      <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
                    )}
                    <Text type={stat.trendUp ? 'success' : 'danger'} style={{ fontSize: '14px', margin: 0 }}>
                      {stat.trend}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快捷操作 */}
      <Card
        title="快捷操作"
        style={{ marginTop: '24px', borderRadius: '12px' }}
      >
        <Space size="large" wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ background: '#1890ff', borderColor: '#1890ff', height: '48px' }}
            onClick={() => navigate('/funds')}
          >
            创建基金
          </Button>
          <Button
            icon={<UserOutlined />}
            size="large"
            onClick={() => navigate('/funds')}
          >
            添加投资者
          </Button>
        </Space>
      </Card>

      {/* 最近操作 */}
      <Card
        title="最近操作"
        style={{ marginTop: '24px', borderRadius: '12px' }}
      >
        {recentOperations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无操作记录
          </div>
        ) : (
          <div>
            {recentOperations.map((op, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderBottom: index < recentOperations.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                    {op.type}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {op.investor}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: op.amount.startsWith('+') ? '#52c41a' : '#ff4d4f',
                    }}
                  >
                    {op.amount}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    {op.time}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
