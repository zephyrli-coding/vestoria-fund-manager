import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, DatePicker, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFundStore } from '@/stores/fund';

export default function CreateFund() {
  const navigate = useNavigate();
  const { createFund } = useFundStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createFund({
        name: values.name,
        start_date: values.start_date.format('YYYY-MM-DD'),
      });
      message.success('基金创建成功');
      navigate('/funds');
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

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
            创建基金
          </h2>
        </div>
      </div>

      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            start_date: dayjs(),
          }}
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
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
