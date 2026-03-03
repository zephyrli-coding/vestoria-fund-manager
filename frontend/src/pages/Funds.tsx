import React from 'react';
import { Table, Tag, Space, Button, Dropdown, Menu, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, FundViewOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Fund } from '@/types/api';
import { useFundStore } from '@/stores/fund';

export default function Funds() {
  const navigate = useNavigate();
  const { funds, loading, fetchFunds, deleteFund } = useFundStore();

  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deleteFundId, setDeleteFundId] = React.useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  React.useEffect(() => {
    fetchFunds();
  }, []);

  const handleDelete = async () => {
    if (!deleteFundId) return;

    setDeleteLoading(true);
    try {
      await deleteFund(deleteFundId);
      message.success('基金删除成功');
      setDeleteModalVisible(false);
      setDeleteFundId(null);
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      title: '基金名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Fund) => (
        <a
          href={`/funds/${record.id}`}
          style={{ color: '#1890ff', fontWeight: 500, textDecoration: 'none' }}
          onClick={(e) => e.preventDefault()}
        >
          {text}
        </a>
      ),
    },
    {
      title: '净值',
      dataIndex: 'net_asset_value',
      key: 'net_asset_value',
      render: (value: number) => (
        <Tag color={value >= 1.0 ? 'green' : value >= 0.8 ? 'blue' : 'orange'}>
          {value.toFixed(2)}
        </Tag>
      ),
    },
    {
      title: '总资产',
      dataIndex: 'balance',
      key: 'balance',
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 600 }}>
          ¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '成立日期',
      dataIndex: 'start_date',
      key: 'start_date',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Fund) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<FundViewOutlined />}
            onClick={() => navigate(`/funds/${record.id}`)}
          >
            查看
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: '编辑',
                  icon: <EditOutlined />,
                  onClick: () => navigate(`/funds/${record.id}/edit`),
                },
                {
                  key: 'delete',
                  label: '删除',
                  icon: <DeleteOutlined />,
                  onClick: () => {
                    setDeleteFundId(record.id);
                    setDeleteModalVisible(true);
                  },
                  danger: true,
                },
              ],
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          基金列表
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/funds/create')}
        >
          创建基金
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          加载中...
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={funds}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      )}

      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteFundId(null);
        }}
        confirmLoading={deleteLoading}
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        确定要删除这个基金吗？删除后无法恢复。
      </Modal>
    </div>
  );
}
