import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Button, Space, Tag, Dropdown, Modal, Form, Input, message, Row, Col, Statistic } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { Fund, Investor } from '@/types/api';

export default function Investors() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fund, setFund] = useState<Fund | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 添加投资者
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [adding, setAdding] = useState(false);
  
  // 删除投资者
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInvestorId, setDeleteInvestorId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 份额操作
  const [operationModalVisible, setOperationModalVisible] = useState(false);
  const [operationType, setOperationType] = useState<'invest' | 'redeem' | 'transfer' | null>(null);
  const [operationForm] = Form.useForm();
  const [operating, setOperating] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // 获取基金和投资者数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取基金详情
        const fundRes = await fetch(`/api/v1/funds/${id}`, { headers });
        const fundData = await fundRes.json();
        if (fundData.code === 0) {
          setFund(fundData.data);
        }

        // 获取投资者列表
        const invRes = await fetch(`/api/v1/funds/${id}/investors`, { headers });
        const invData = await invRes.json();
        if (invData.code === 0) {
          setInvestors(invData.data.items || []);
        }
      } catch (error: any) {
        message.error('获取数据失败：' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // 添加投资者
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setAdding(true);
      
      const response = await fetch(`/api/v1/funds/${id}/investors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: values.name }),
      });
      const data = await response.json();

      if (data.code === 0) {
        message.success('投资者添加成功');
        setInvestors([...investors, data.data]);
        setAddModalVisible(false);
        addForm.resetFields();
      } else {
        message.error(data.message || '添加失败');
      }
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  // 删除投资者
  const handleDelete = async () => {
    if (!deleteInvestorId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/funds/${id}/investors/${deleteInvestorId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (data.code === 0) {
        message.success('投资者删除成功');
        setInvestors(investors.filter(inv => inv.id !== deleteInvestorId));
        setDeleteModalVisible(false);
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 打开份额操作弹窗
  const openOperationModal = (type: 'invest' | 'redeem' | 'transfer', investor: Investor) => {
    setOperationType(type);
    setSelectedInvestor(investor);
    operationForm.resetFields();
    setOperationModalVisible(true);
  };

  // 执行份额操作
  const handleOperation = async () => {
    try {
      const values = await operationForm.validateFields();
      setOperating(true);

      let endpoint = '';
      let body: any = {};

      switch (operationType) {
        case 'invest':
          endpoint = `/api/v1/funds/${id}/investors/${selectedInvestor?.id}/invest`;
          body = { amount: values.amount, amount_type: 'balance' };
          break;
        case 'redeem':
          endpoint = `/api/v1/funds/${id}/investors/${selectedInvestor?.id}/redeem`;
          body = { share: values.share };
          break;
        case 'transfer':
          endpoint = `/api/v1/funds/${id}/investors/transfer`;
          body = { from_investor_id: selectedInvestor?.id, to_investor_id: values.to_investor_id, share: values.share };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (data.code === 0) {
        message.success('操作成功');
        setOperationModalVisible(false);
        // 刷新数据
        const invRes = await fetch(`/api/v1/funds/${id}/investors`, { headers });
        const invData = await invRes.json();
        if (invData.code === 0) {
          setInvestors(invData.data || []);
        }
        const fundRes = await fetch(`/api/v1/funds/${id}`, { headers });
        const fundData = await fundRes.json();
        if (fundData.code === 0) {
          setFund(fundData.data);
        }
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setOperating(false);
    }
  };

  const columns = [
    {
      title: '投资者姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '持有份额',
      dataIndex: 'share',
      key: 'share',
      render: (share: number) => share.toFixed(4),
    },
    {
      title: '持有市值',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '占比',
      key: 'ratio',
      render: (_: any, record: Investor) => {
        const ratio = fund?.total_share ? (record.share / fund.total_share) * 100 : 0;
        return <Tag color={ratio > 50 ? 'red' : 'blue'}>{ratio.toFixed(2)}%</Tag>;
      },
    },
    {
      title: '加入日期',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: any, record: Investor) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => openOperationModal('invest', record)}
          >
            申购
          </Button>
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => openOperationModal('redeem', record)}
          >
            赎回
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'transfer',
                  label: '转账',
                  icon: <SwapOutlined />,
                  onClick: () => openOperationModal('transfer', record),
                },
                {
                  key: 'delete',
                  label: '删除',
                  icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                  onClick: () => {
                    setDeleteInvestorId(record.id);
                    setDeleteModalVisible(true);
                  },
                  danger: true,
                },
              ],
            }}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  if (!fund) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
        {loading ? '加载中...' : '未找到该基金'}
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
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            {fund.name} - 投资者管理
          </h2>
          <div style={{ color: '#999', marginTop: '4px' }}>
            管理基金投资者及份额操作
          </div>
        </div>
        <Button type="text" onClick={() => navigate(`/funds/${id}`)}>
          返回基金详情
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="投资者总数"
              value={investors.length}
              valueStyle={{ fontSize: '36px', color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前净值"
              value={fund.net_asset_value}
              prefix="¥"
              precision={4}
              valueStyle={{ fontSize: '36px', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总份额"
              value={fund.total_share}
              precision={4}
              valueStyle={{ fontSize: '36px', color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setAddModalVisible(true)}
        >
          添加投资者
        </Button>
      </Card>

      {/* 投资者列表 */}
      <Card title="投资者列表">
        <Table
          columns={columns}
          dataSource={investors}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 添加投资者弹窗 */}
      <Modal
        title="添加投资者"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        confirmLoading={adding}
        okText="添加"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="name"
            label="投资者姓名"
            rules={[{ required: true, message: '请输入投资者姓名' }]}
          >
            <Input placeholder="请输入投资者姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteInvestorId(null);
        }}
        confirmLoading={deleting}
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除该投资者吗？此操作不可恢复。</p>
      </Modal>

      {/* 份额操作弹窗 */}
      <Modal
        title={
          operationType === 'invest' ? '申购份额' : 
          operationType === 'redeem' ? '赎回份额' : 
          '转账'
        }
        open={operationModalVisible}
        onOk={handleOperation}
        onCancel={() => {
          setOperationModalVisible(false);
          setSelectedInvestor(null);
          operationForm.resetFields();
        }}
        confirmLoading={operating}
        okText="确认"
        cancelText="取消"
      >
        <Form form={operationForm} layout="vertical">
          <Form.Item>
            <div style={{ marginBottom: '16px' }}>
              <strong>投资者：</strong> {selectedInvestor?.name}
            </div>
          </Form.Item>
          
          {operationType === 'invest' && (
            <Form.Item
              name="amount"
              label="投资金额 (¥)"
              rules={[{ required: true, message: '请输入投资金额' }]}
            >
              <Input type="number" placeholder="请输入投资金额" />
            </Form.Item>
          )}
          
          {(operationType === 'redeem' || operationType === 'transfer') && (
            <Form.Item
              name="share"
              label="份额数量"
              rules={[{ required: true, message: '请输入份额数量' }]}
            >
              <Input type="number" placeholder="请输入份额数量" />
            </Form.Item>
          )}
          
          {operationType === 'transfer' && (
            <Form.Item
              name="to_investor_id"
              label="转入投资者"
              rules={[{ required: true, message: '请选择转入投资者' }]}
            >
              <Input placeholder="请输入投资者ID" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
