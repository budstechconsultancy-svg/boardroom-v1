import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Input, Switch, Select, Button, Table, Tag, message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Admin: React.FC = () => {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/settings/');
            setSettings(response.data);

            // Map settings to form fields
            const formValues: any = {};
            response.data.forEach((s: any) => {
                formValues[s.key] = s.value;
            });
            form.setFieldsValue(formValues);
        } catch (error) {
            console.error('Error fetching settings:', error);
            message.error('Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
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
            message.success('Settings saved successfully!');
            fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const users = [
        { id: 1, name: 'Admin User', email: 'admin@company.com', role: 'Owner', status: 'active' },
        { id: 2, name: 'CFO', email: 'cfo@company.com', role: 'CXO', status: 'active' },
        { id: 3, name: 'Auditor', email: 'auditor@company.com', role: 'Auditor', status: 'active' },
    ];

    if (loading && settings.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} tip="Loading Admin Panel..." />
            </div>
        );
    }

    return (
        <Tabs defaultActiveKey="settings" items={[
            {
                key: 'settings',
                label: 'Settings',
                children: (
                    <Card title="Tenant Settings">
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
                            <Form.Item name="company_name" label="Company Name">
                                <Input />
                            </Form.Item>
                            <Form.Item name="ceo_mode" label="CEO Mode">
                                <Select>
                                    <Select.Option value="ai">AI (Full Automation)</Select.Option>
                                    <Select.Option value="human">Human (Manual Approval)</Select.Option>
                                    <Select.Option value="hybrid">Hybrid (Risk-Based)</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="auto_execute_low_risk" label="Auto-Execute Low Risk" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item name="rollback_window" label="Rollback Window (minutes)">
                                <Input type="number" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>Save Settings</Button>
                        </Form>
                    </Card>
                ),
            },
            {
                key: 'users',
                label: 'Users',
                children: (
                    <Card title="User Management" extra={<Button type="primary">Add User</Button>}>
                        <Table
                            dataSource={users}
                            columns={[
                                { title: 'Name', dataIndex: 'name' },
                                { title: 'Email', dataIndex: 'email' },
                                { title: 'Role', dataIndex: 'role', render: (r: string) => <Tag color="blue">{r}</Tag> },
                                { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color="success">{s}</Tag> },
                                { title: 'Actions', render: () => <Button size="small">Edit</Button> },
                            ]}
                            rowKey="id"
                        />
                    </Card>
                ),
            },
            {
                key: 'audit',
                label: 'Audit',
                children: (
                    <Card title="Audit Logs">
                        <Button type="primary" style={{ marginBottom: 16 }}>Export Audit Bundle</Button>
                        <Table
                            dataSource={[
                                { time: '2024-01-20 10:30', event: 'Proposal Approved', user: 'CEO', details: 'P-001' },
                                { time: '2024-01-20 09:15', event: 'Connector Synced', user: 'System', details: 'Tally' },
                            ]}
                            columns={[
                                { title: 'Time', dataIndex: 'time' },
                                { title: 'Event', dataIndex: 'event' },
                                { title: 'User', dataIndex: 'user' },
                                { title: 'Details', dataIndex: 'details' },
                            ]}
                            rowKey="time"
                        />
                    </Card>
                ),
            },
        ]} />
    );
};

export default Admin;
