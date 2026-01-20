import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    RobotOutlined,
    ApiOutlined,
    SettingOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: '/proposals', icon: <FileTextOutlined />, label: 'Proposals' },
        { key: '/agents', icon: <RobotOutlined />, label: 'CXO Agents' },
        { key: '/connectors', icon: <ApiOutlined />, label: 'Connectors' },
        { key: '/admin', icon: <SettingOutlined />, label: 'Admin' },
    ];

    const userMenu = (
        <Menu
            items={[
                { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
                { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
            ]}
        />
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                theme="light"
                width={240}
                style={{
                    borderRight: '1px solid #f0f0f0',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                    <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                        🏛️ BoardRoom
                    </Text>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ borderRight: 0, marginTop: 8 }}
                />
            </Sider>

            <Layout style={{ marginLeft: 240 }}>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 16,
                        borderBottom: '1px solid #f0f0f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Badge count={3}>
                        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                    </Badge>
                    <Dropdown overlay={userMenu} placement="bottomRight">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar icon={<UserOutlined />} />
                            <Text>Admin User</Text>
                        </div>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
