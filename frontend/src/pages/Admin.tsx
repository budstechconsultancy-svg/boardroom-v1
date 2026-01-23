import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Input, Switch, Select, Button, Table, Tag, message, Spin, Typography } from 'antd';
import { LoadingOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const { Text, Title } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Admin: React.FC = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [settingsData, usersData] = await Promise.all([
                apiClient.get('/settings/').then(r => r.data),
                apiClient.get('/users/').then(r => r.data)
            ]);

            setSettings(settingsData);
            setUsers(usersData);

            // Map settings to form fields
            const formValues: any = {};
            settingsData.forEach((s: any) => {
                formValues[s.key] = s.value;
            });
            form.setFieldsValue(formValues);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            messageApi.error('Failed to load admin data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleSaveSettings = async (values: any) => {
        setLoading(true);
        try {
            for (const key in values) {
                const existingSetting = settings.find(s => s.key === key);
                if (existingSetting) {
                    await apiClient.put(`/settings/${key}/`, { key, value: values[key] });
                } else {
                    await apiClient.post('/settings/', { key, value: values[key] });
                }
            }
            messageApi.success('Settings saved successfully!');
            fetchAdminData();
        } catch (error) {
            console.error('Error saving settings:', error);
            messageApi.error('Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && settings.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading Admin Panel...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            {contextHolder}
            <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>System Administration</Title>
            <Tabs
                defaultActiveKey="settings"
                className="custom-tabs"
                items={[
                    {
                        key: 'settings',
                        label: <span style={{ padding: '0 12px' }}>⚙️ Global Settings</span>,
                        children: (
                            <Card className="glass-card" title={<span style={{ color: '#fff' }}>Tenant Configuration</span>}>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    style={{ maxWidth: 500 }}
                                    onFinish={handleSaveSettings}
                                    initialValues={{
                                        company_name: "Acme Corp",
                                        ceo_mode: "hybrid",
                                        auto_execute_low_risk: true,
                                        rollback_window: 60
                                    }}
                                >
                                    <Form.Item name="company_name" label={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Company Name</span>}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name="ceo_mode" label={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>CEO mode</span>}>
                                        <Select>
                                            <Select.Option value="ai">AI (Full Automation)</Select.Option>
                                            <Select.Option value="human">Human (Manual Approval)</Select.Option>
                                            <Select.Option value="hybrid">Hybrid (Risk-Based)</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="auto_execute_low_risk" label={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Auto-Execute Low Risk</span>} valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item name="rollback_window" label={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Rollback Window (minutes)</span>}>
                                        <Input type="number" />
                                    </Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 40, marginTop: 12 }}>
                                        Save System State
                                    </Button>
                                </Form>
                            </Card>
                        ),
                    },
                    {
                        key: 'users',
                        label: <span style={{ padding: '0 12px' }}>👥 User Management</span>,
                        children: (
                            <Card className="glass-card" title={<span style={{ color: '#fff' }}>Authorized Council Members</span>} extra={<Button type="primary" icon={<PlusOutlined />}>Add Member</Button>} styles={{ body: { padding: 0 } }}>
                                <Table
                                    dataSource={users}
                                    style={{ padding: '0 24px 24px 24px' }}
                                    columns={[
                                        { title: 'Name', dataIndex: 'username', render: (t: string) => <Text style={{ color: '#fff' }}>{t}</Text> },
                                        { title: 'Email', dataIndex: 'email', render: (t: string) => <Text type="secondary">{t}</Text> },
                                        { title: 'Role', dataIndex: 'role', render: (r: string) => <Tag style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', color: '#8b5cf6' }}>{r}</Tag> },
                                        { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color="success" style={{ background: 'transparent' }}>{(s || 'active').toUpperCase()}</Tag> },
                                        { title: 'Actions', render: () => <Button type="link" style={{ color: '#8b5cf6' }}>Edit</Button> },
                                    ]}
                                    rowKey="id"
                                    pagination={false}
                                />
                            </Card>
                        ),
                    },
                    {
                        key: 'audit',
                        label: <span style={{ padding: '0 12px' }}>📜 Compliance Audit</span>,
                        children: (
                            <Card className="glass-card" title={<span style={{ color: '#fff' }}>Immuta-Logs</span>} extra={<Button icon={<DownloadOutlined />}>Export Bundle</Button>} styles={{ body: { padding: 0 } }}>
                                <Table
                                    dataSource={[
                                        { time: '2024-01-20 10:30', event: 'Proposal Approved', user: 'CEO', details: 'P-001' },
                                        { time: '2024-01-20 09:15', event: 'Connector Synced', user: 'System', details: 'Tally' },
                                    ]}
                                    style={{ padding: '0 24px 24px 24px' }}
                                    columns={[
                                        { title: 'Time', dataIndex: 'time', render: (t: string) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text> },
                                        { title: 'Event', dataIndex: 'event', render: (t: string) => <Text style={{ color: '#fff' }}>{t}</Text> },
                                        { title: 'User', dataIndex: 'user', render: (t: string) => <Tag style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>{t}</Tag> },
                                        { title: 'Details', dataIndex: 'details', render: (t: string) => <Text style={{ color: '#8b5cf6' }}>{t}</Text> },
                                    ]}
                                    rowKey="time"
                                    pagination={false}
                                />
                            </Card>
                        ),
                    },
                ]} />
        </div>
    );
};

export default Admin;
