import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Card, Button, Space, Tag, Dropdown, Modal, Form, Input, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  DeleteOutlined,
  MoreOutlined,
  FundViewOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Fund, Investor } from '@/types/api';
import { useFundStore } from '@/stores/fund';

export default function Investors() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentFund } = useFundStore();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInvestorId, setDeleteInvestorId] = useState<number | null>(null);

  // 添加投资者的表单
  const [addForm, setAddForm] = useState({ name: '' });

  useEffect(() => {
    if (currentFund?.id === Number(id)) {
      setInvestors(currentFund.investors || []);
    }
  }, [id, currentFund]);

  const handleAddInvestor = async () => {
    if (!currentFund) return;

    setAddForm({ name: '' });
    setAddModalVisible(true);
  };

  const handleAddSubmit = async () => {
    if (!currentFund || !addForm.name) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/funds/${id}/investors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name }),
      });

      const data = await response.json();

      if (data.code === 0) {
        const newInvestor = data.data;
        setInvestors([...investors, newInvestor]);
        setAddModalVisible(false);
        setAddForm({ name: '' });
        message.success('投资者添加成功');
      } else {
        message.error(data.message || '添加失败');
      }
    } catch (error: any) {
      message.error('网络错误：' + error.message);
    }
  };

  const handleDelete = (investorId: number) => {
    setDeleteInvestorId(investorId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteInvestorId) return;

    try {
      const response = await fetch(`/api/v1/funds/${id}/investors/${deleteInvestorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.code === 0) {
        setInvestors(investors.filter(inv => inv.id !== deleteInvestorId));
        setDeleteModalVisible(false);
        setDeleteInvestorId(null);
        message.success('投资者删除成功');
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error: any) {
      message.error('网络错误：' + error.message);
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
      render: (share: number) => share.toFixed(2),
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
        const ratio = record.share / (currentFund?.total_share || 1);
        const percent = (ratio * 100).toFixed(2);
        return <Tag color="blue">{percent}%</Tag>;
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
      render: (_: any, record: Investor) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <FundViewOutlined style={{ color: '#1890ff' }} />,
                onClick: () => {},
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                onClick: () => handleDelete(record.id),
                danger: true,
              },
            ],
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (!currentFund) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            {currentFund.name} - 投资者管理
          </h2>
        </div>
        <Button
          type="text"
          onClick={() => navigate('/funds')}
        >
          返回基金列表
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>
              {investors.length}
            </div>
            <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: '14px' }}>
              投资者总数
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>
              ¥{currentFund.balance?.toFixed(2) || '0.00'}
            </div>
            <div style={{ textAlign: 'center', color: '#52c41a', fontSize: '14px' }}>
              总市值
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
          >
            <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '12px' }}>
              {currentFund.total_share?.toFixed(2) || '0.00'}
            </div>
            <div style={{ textAlign: 'center', color: '#faad14', fontSize: '14px' }}>
              总份额
            </div>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ background: '#1890ff', borderColor: '#1890ff' }}
          onClick={handleAddInvestor}
        >
          添加投资者
        </Button>
      </Card>

      {/* 投资者列表 */}
      <Card
        title="投资者列表"
        style={{ borderRadius: '12px' }}
      >
        <Table
          columns={columns}
          dataSource={investors}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* 添加投资者弹窗 */}
      <Modal
        title="添加投资者"
        open={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => {
          setAddModalVisible(false);
          setAddForm({ name: '' });
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item
            label="投资者姓名"
            name="name"
            rules={[
              { required: true, message: '请输入投资者姓名' },
              { max: 50, message: '姓名不能超过50个字符' },
            ]}
          >
            <Input
              placeholder="请输入投资者姓名"
              value={addForm.name}
              onChange={(e) => setAddForm({ name: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteInvestorId(null);
        }}
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除该投资者吗？删除后无法恢复。</p>
      </Modal>
    </div>
  );
}
