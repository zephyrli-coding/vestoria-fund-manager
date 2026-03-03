import { Outlet, Link } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Typography, Button } from 'antd';
import {
  HomeOutlined,
  FundOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';

const { Header, Text } = Typography;

export default function MainLayout() {
  const { logout } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: '/funds',
      icon: <FundOutlined />,
      label: <Link to="/funds">基金列表</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: () => logout(),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }} hasSider>
      <Layout.Sider 
        collapsible 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={theme.dark}
        style={{ background: '#001529' }}
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #303030',
        }}>
          <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>
            💰
          </Text>
        </div>

        <Menu
          theme={theme.dark}
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems}
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text strong style={{ fontSize: '16px' }}>
              基金管理系统
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<UserOutlined />}>
                管理员
              </Button>
            </Dropdown>
          </div>
        </Layout.Header>

        <Layout.Content style={{ background: '#f0f2f5', margin: 0 }}>
          <div style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
