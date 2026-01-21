import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, List, Button, Empty } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    RobotOutlined,
    ApiOutlined,
    SettingOutlined,
    BellOutlined,
    UserOutlined,
    LogoutOutlined,
    CheckOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useNotifications } from '../contexts/NotificationContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

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

    const notificationMenu = (
        <div style={{ width: 350, maxHeight: 400, overflow: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Notifications</Text>
                <div>
                    <Button size="small" type="text" icon={<CheckOutlined />} onClick={markAllAsRead}>
                        Mark all read
                    </Button>
                    <Button size="small" type="text" icon={<DeleteOutlined />} onClick={clearAll}>
                        Clear
                    </Button>
                </div>
            </div>
            {notifications.length === 0 ? (
                <Empty description="No notifications" style={{ padding: 24 }} />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            key={item.id}
                            style={{
                                padding: '12px 16px',
                                background: item.read ? '#fff' : '#f0f7ff',
                                cursor: 'pointer'
                            }}
                            onClick={() => markAsRead(item.id)}
                        >
                            <List.Item.Meta
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong={!item.read}>{item.title}</Text>
                                        {!item.read && <Badge status="processing" />}
                                    </div>
                                }
                                description={
                                    <>
                                        <div>{item.message}</div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {new Date(item.timestamp).toLocaleString()}
                                        </Text>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
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
                    <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
                        <Badge count={unreadCount}>
                            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                        </Badge>
                    </Dropdown>
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
