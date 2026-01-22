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
        <div style={{ width: 350, maxHeight: 400, overflow: 'auto', background: '#1a0b3d', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ color: '#fff' }}>Notifications</Text>
                <div>
                    <Button size="small" type="text" icon={<CheckOutlined />} onClick={markAllAsRead} style={{ color: '#8b5cf6' }}>
                        Mark all read
                    </Button>
                    <Button size="small" type="text" icon={<DeleteOutlined />} onClick={clearAll} style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                        Clear
                    </Button>
                </div>
            </div>
            {notifications.length === 0 ? (
                <Empty description={<Text type="secondary">No notifications</Text>} style={{ padding: 24 }} />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            key={item.id}
                            style={{
                                padding: '12px 16px',
                                background: item.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                            onClick={() => markAsRead(item.id)}
                        >
                            <List.Item.Meta
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong={!item.read} style={{ color: item.read ? 'rgba(255, 255, 255, 0.85)' : '#fff' }}>{item.title}</Text>
                                        {!item.read && <Badge status="processing" color="#8b5cf6" />}
                                    </div>
                                }
                                description={
                                    <>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{item.message}</div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
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
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
            <Sider
                theme="dark"
                width={240}
                style={{
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    background: 'rgba(13, 6, 26, 0.7)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1001,
                }}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Text strong style={{ fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 24, marginRight: 8 }}>🏛️</span> BoardRoom
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

            <Layout style={{ marginLeft: 240, background: 'transparent' }}>
                <Header
                    style={{
                        background: 'rgba(13, 6, 26, 0.5)',
                        backdropFilter: 'blur(10px)',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 16,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1000,
                    }}
                >
                    <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
                        <Badge count={unreadCount} color="#8b5cf6">
                            <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: 'rgba(255, 255, 255, 0.85)' }} />
                        </Badge>
                    </Dropdown>
                    <Dropdown overlay={userMenu} placement="bottomRight">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar icon={<UserOutlined style={{ color: '#fff' }} />} style={{ backgroundColor: '#8b5cf6' }} />
                            <Text style={{ color: '#fff' }}>Admin User</Text>
                        </div>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 32, minHeight: 'calc(100vh - 64px)' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
