import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await login(form.username, form.password);
      navigate('/');
    } catch (error: {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f5f5f5',
    }}>
      <Card 
        style={{ 
          width: 400,
          padding: '40px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>基金管理系统</Title>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>登录</Title>
        </div>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="admin"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密玛"
            name="password"
            rules={[{ required: true, message: '请输入密玛' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="[REDACTED_TEST_PASSWORD]"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              size="large"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{ background: '#1890ff', borderColor: '#1890ff' }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
