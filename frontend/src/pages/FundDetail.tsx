import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Button, Space, Statistic, Spin, Tabs, Table } from 'antd';
import {
  ArrowUpOutlined,
  FundViewOutlined,
  UserOutlined,
  WalletOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Fund, FundChartData } from '@/types/api';
import { useFundStore } from '@/stores/fund';
import { Button as ButtonComponent } from '@/components/common/Button';

export default function FundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentFund, setCurrentFund, updateNav } = useFundStore();

  const [loading, setLoading] = useState(false);
  const [navUpdating, setNavUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [capital, setCapital] = useState<number>(0);

  useEffect(() => {
    const fund = currentFund;
    if (fund) {
      setCapital(fund.balance);
    }
  }, [currentFund]);

  const handleUpdateNav = async () => {
    if (!currentFund) return;

    setNavUpdating(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      await updateNav(Number(id), capital, date);
      message.success('NAV 更新成功');
    } catch (error: any) {
      message.error('NAV 更新失败: ' + error.message);
    } finally {
      setNavUpdating(false);
    }
  };

  const renderOverview = () => (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* 统计卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <Statistic
              title="当前净值"
              value={currentFund?.net_asset_value || 0}
              prefix="¥"
              precision={2}
              valueStyle={{
                color: '#1890ff',
                fontSize: '28px',
                fontWeight: 600,
              }}
              suffix={
                <Tag color={currentFund?.net_asset_value >= 1.0 ? 'green' : 'orange'}>
                  {(currentFund?.net_asset_value || 0) >= 1.0 ? '上涨' : '下跌'}
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <Statistic
              title="总资产"
              value={currentFund?.balance || 0}
              prefix="¥"
              precision={2}
              valueStyle={{
                color: '#52c41a',
                fontSize: '28px',
                fontWeight: 600,
              }}
              prefix={<WalletOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <Statistic
              title="总份额"
              value={currentFund?.total_share || 0}
              precision={6}
              suffix={<FundViewOutlined style={{ fontSize: '20px', color: '#faad14' }} />}
              valueStyle={{
                color: '#1890ff',
                fontSize: '28px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <Statistic
              title="投资者数量"
              value={currentFund?.investors ? currentFund.investors.length : 0}
              prefix={<UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              valueStyle={{
                color: '#1890ff',
                fontSize: '28px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 基本信息 */}
      <Card
        title="基本信息"
        style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
      >
        <Descriptions column={{ xs: 1 }} labelStyle={{ width: '120px', fontWeight: 500 }}>
          <Descriptions.Item label="基金名称">
            {currentFund?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="成立日期">
            {currentFund?.start_date || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {currentFund?.created_at ? new Date(currentFund.created_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {currentFund?.updated_at ? new Date(currentFund.updated_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Spin>
  );

  return (
    <div>
      {/* 面包屑 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
          基金详情
        </h2>
        <Button
          type="text"
          onClick={() => navigate('/funds')}
        >
          返回列表
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          加载中...
        </div>
      ) : (
        <>
          <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '24px' }}>
            <Tabs.TabPane tabKey="overview" tab="概览">
              {renderOverview()}
            </Tabs.TabPane>
            <Tabs.TabPane tabKey="history" tab="历史记录">
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                功能开发中...
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tabKey="chart" tab="图表分析">
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                功能开发中...
              </div>
            </Tabs.TabPane>
          </Tabs>

          {/* 操作按钮 */}
          <Space style={{ marginTop: '24px' }} size="large">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/funds/${id}/investors`)}
            >
              添加投资者
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/funds/${id}/edit`)}
            >
              编辑基金
            </Button>
            <Button
              type="primary"
              icon={<ArrowUpOutlined />}
              onClick={() => navigate(`/funds/${id}/nav-update`)}
              loading={navUpdating}
            >
              更新 NAV
            </Button>
          </Space>
        </>
      )}
    </div>
  );
}
