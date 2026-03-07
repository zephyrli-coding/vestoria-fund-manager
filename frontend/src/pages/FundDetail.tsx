import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Button, Space, Statistic, Spin, Tabs, message, Table, InputNumber, DatePicker, Modal } from 'antd';
import {
  ArrowUpOutlined,
  UserOutlined,
  WalletOutlined,
  PlusOutlined,
  EditOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Fund, Operation } from '@/types/api';

export default function FundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fund, setFund] = useState<Fund | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // NAV 更新弹窗
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [navValue, setNavValue] = useState<number>(0);
  const [navDate, setNavDate] = useState(dayjs());
  const [updatingNav, setUpdatingNav] = useState(false);

  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // 获取基金详情
  const fetchFund = async () => {
    try {
      const response = await fetch(`/api/v1/funds/${id}`, { headers });
      const data = await response.json();
      if (data.code === 0) {
        setFund(data.data);
      }
    } catch (error: any) {
      message.error('获取基金详情失败');
    }
  };

  // 获取操作记录
  const fetchOperations = async () => {
    try {
      const response = await fetch(`/api/v1/funds/${id}/history`, { headers });
      const data = await response.json();
      if (data.code === 0) {
        setOperations(data.data?.items || []);
      }
    } catch (error: any) {
      message.error('获取操作记录失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFund(), fetchOperations()]);
      setLoading(false);
    };
    if (id) {
      loadData();
    }
  }, [id]);

  // NAV 更新
  const handleUpdateNav = async () => {
    if (!navValue || navValue <= 0) {
      message.error('请输入有效的 NAV 值');
      return;
    }
    
    setUpdatingNav(true);
    try {
      const response = await fetch(`/api/v1/funds/${id}/update-nav`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nav: navValue,
          date: navDate.format('YYYY-MM-DD'),
        }),
      });
      const data = await response.json();
      
      if (data.code === 0) {
        message.success('NAV 更新成功');
        setNavModalVisible(false);
        await fetchFund();
        await fetchOperations();
      } else {
        message.error(data.message || 'NAV 更新失败');
      }
    } catch (error: any) {
      message.error('NAV 更新失败');
    } finally {
      setUpdatingNav(false);
    }
  };

  // 打开 NAV 更新弹窗
  const openNavModal = () => {
    setNavValue(fund?.net_asset_value || 0);
    setNavDate(dayjs());
    setNavModalVisible(true);
  };

  const renderOverview = () => (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="当前净值"
              value={fund?.net_asset_value || 0}
              prefix="¥"
              precision={4}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="总资产"
              value={fund?.balance || 0}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="总份额"
              value={fund?.total_share || 0}
              precision={4}
              valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="投资者数量"
              value={0}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="基本信息" style={{ borderRadius: '12px' }}>
        <Descriptions column={{ xs: 1 }} labelStyle={{ width: '120px', fontWeight: 500 }}>
          <Descriptions.Item label="基金名称">{fund?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="成立日期">{fund?.start_date || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {fund?.created_at ? new Date(fund.created_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {fund?.updated_at ? new Date(fund.updated_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Spin>
  );

  // 操作记录表格列
  const operationColumns = [
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          invest: { text: '申购', color: 'green' },
          redeem: { text: '赎回', color: 'red' },
          transfer: { text: '转账', color: 'blue' },
          update_nav: { text: 'NAV更新', color: 'purple' },
          add_investor: { text: '添加投资者', color: 'orange' },
        };
        const { text, color } = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '日期',
      dataIndex: 'operation_date',
      key: 'operation_date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '金额/份额',
      key: 'amount',
      render: (_: any, record: Operation) => {
        if (record.amount !== null && record.amount !== undefined) {
          return `¥${record.amount.toFixed(2)}`;
        }
        if (record.share !== null && record.share !== undefined) {
          return `${record.share.toFixed(4)} 份`;
        }
        return '-';
      },
    },
    {
      title: 'NAV变化',
      key: 'nav',
      render: (_: any, record: Operation) => {
        if (record.nav_before !== null && record.nav_after !== null) {
          return `${record.nav_before.toFixed(4)} → ${record.nav_after.toFixed(4)}`;
        }
        return '-';
      },
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string | null) => notes || '-',
    },
  ];

  const renderHistory = () => (
    <Card title="操作记录" style={{ borderRadius: '12px' }}>
      <Table
        columns={operationColumns}
        dataSource={operations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );

  if (!fund && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
        未找到该基金
      </div>
    );
  }

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
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>{fund?.name}</h2>
          <div style={{ color: '#999', marginTop: '4px' }}>基金详情</div>
        </div>
        <Button type="text" onClick={() => navigate('/funds')}>返回列表</Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: '24px' }}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: renderOverview(),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> 操作记录
              </span>
            ),
            children: renderHistory(),
          },
        ]}
      />

      {/* 操作按钮 */}
      <Space style={{ marginTop: '24px' }} size="large">
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => navigate(`/funds/${id}/investors`)}
        >
          投资者管理
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
          onClick={openNavModal}
        >
          更新 NAV
        </Button>
      </Space>

      {/* NAV 更新弹窗 */}
      <Modal
        title="更新 NAV"
        open={navModalVisible}
        onOk={handleUpdateNav}
        onCancel={() => {
          setNavModalVisible(false);
          setNavValue(0);
        }}
        confirmLoading={updatingNav}
        okText="更新"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <div>当前 NAV: ¥{fund?.net_asset_value.toFixed(4)}</div>
          <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
            更新 NAV 会重新计算所有投资者的持仓市值
          </div>
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>新 NAV 值：</label>
            <InputNumber
              style={{ width: '100%', marginTop: '8px' }}
              value={navValue}
              onChange={(val) => setNavValue(val || 0)}
              precision={4}
              min={0}
              placeholder="请输入新的 NAV 值"
            />
          </div>
          <div>
            <label>生效日期：</label>
            <DatePicker
              style={{ width: '100%', marginTop: '8px' }}
              value={navDate}
              onChange={(date) => setNavDate(date || dayjs())}
              format="YYYY-MM-DD"
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
