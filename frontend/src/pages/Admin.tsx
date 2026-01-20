import React from 'react';
import { Tabs, Card, Form, Input, Switch, Select, Button, Table, Tag } from 'antd';

const Admin: React.FC = () => {
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@company.com', role: 'Owner', status: 'active' },
        { id: 2, name: 'CFO', email: 'cfo@company.com', role: 'CXO', status: 'active' },
        { id: 3, name: 'Auditor', email: 'auditor@company.com', role: 'Auditor', status: 'active' },
    ];

    return (
        <Tabs defaultActiveKey="settings" items={[
            {
                key: 'settings',
                label: 'Settings',
                children: (
                    <Card title="Tenant Settings">
                        <Form layout="vertical" style={{ maxWidth: 500 }}>
                            <Form.Item label="Company Name"><Input defaultValue="Acme Corp" /></Form.Item>
                            <Form.Item label="CEO Mode">
                                <Select defaultValue="hybrid">
                                    <Select.Option value="ai">AI (Full Automation)</Select.Option>
                                    <Select.Option value="human">Human (Manual Approval)</Select.Option>
                                    <Select.Option value="hybrid">Hybrid (Risk-Based)</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Auto-Execute Low Risk"><Switch defaultChecked /></Form.Item>
                            <Form.Item label="Rollback Window (minutes)"><Input type="number" defaultValue={60} /></Form.Item>
                            <Button type="primary">Save Settings</Button>
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
