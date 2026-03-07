import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, DatePicker, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Fund } from '@/types/api';

export default function EditFund() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fund, setFund] = useState<Fund | null>(null);

  // 获取基金详情
  useEffect(() => {
    const fetchFund = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/funds/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (data.code === 0) {
          setFund(data.data);
          form.setFieldsValue({
            name: data.data.name,
            start_date: dayjs(data.data.start_date),
          });
        } else {
          message.error(data.message || '获取基金详情失败');
        }
      } catch (error: any) {
        message.error('网络错误：' + error.message);
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchFund();
    }
  }, [id, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/funds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: values.name,
          start_date: values.start_date.format('YYYY-MM-DD'),
        }),
      });
      const data = await response.json();
      
      if (data.code === 0) {
        message.success('基金更新成功');
        navigate('/funds');
      } else {
        message.error(data.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#999' }}>加载中...</div>
      </div>
    );
  }

  if (!fund) {
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
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/funds')}
            type="text"
          >
            返回
          </Button>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            编辑基金
          </h2>
        </div>
      </div>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="基金名称"
            name="name"
            rules={[
              { required: true, message: '请输入基金名称' },
              { max: 100, message: '基金名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入基金名称" size="large" />
          </Form.Item>

          <Form.Item
            label="成立日期"
            name="start_date"
            rules={[{ required: true, message: '请选择成立日期' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              size="large"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/funds')} size="large">
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={{ background: '#1890ff', borderColor: '#1890ff' }}
              >
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
