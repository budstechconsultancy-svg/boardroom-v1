import React from 'react';
import { Card, Table, Tag, Button, Space } from 'antd';
import { PlusOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const connectors = [
    { id: 'c-1', name: 'Tally Prime', type: 'Tally', status: 'connected', lastSync: '5 min ago', rowsImported: 1250 },
    { id: 'c-2', name: 'Zoho Books', type: 'Zoho', status: 'connected', lastSync: '1 hour ago', rowsImported: 850 },
    { id: 'c-3', name: 'SAP B1', type: 'SAP', status: 'disconnected', lastSync: 'Never', rowsImported: 0 },
];

const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (s: string) => (
            <Tag icon={s === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={s === 'connected' ? 'success' : 'error'}>
                {s}
            </Tag>
        ),
    },
    { title: 'Last Sync', dataIndex: 'lastSync', key: 'lastSync' },
    { title: 'Rows', dataIndex: 'rowsImported', key: 'rowsImported' },
    {
        title: 'Actions',
        key: 'actions',
        render: () => (
            <Space>
                <Button size="small" icon={<SyncOutlined />}>Sync</Button>
                <Button size="small">Configure</Button>
            </Space>
        ),
    },
];

const Connectors: React.FC = () => (
    <Card title="ERP Connectors" extra={<Button type="primary" icon={<PlusOutlined />}>Add Connector</Button>}>
        <Table dataSource={connectors} columns={columns} rowKey="id" />
    </Card>
);

export default Connectors;
