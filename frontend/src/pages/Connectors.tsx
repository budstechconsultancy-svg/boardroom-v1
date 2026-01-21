import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const initialConnectors = [
    { id: 'c-1', name: 'Tally Prime', type: 'Tally', status: 'connected', lastSync: '5 min ago', rowsImported: 1250, apiKey: '', endpoint: '' },
    { id: 'c-2', name: 'Zoho Books', type: 'Zoho', status: 'connected', lastSync: '1 hour ago', rowsImported: 850, apiKey: '', endpoint: '' },
    { id: 'c-3', name: 'SAP B1', type: 'SAP', status: 'disconnected', lastSync: 'Never', rowsImported: 0, apiKey: '', endpoint: '' },
];

const Connectors: React.FC = () => {
    const [connectors, setConnectors] = useState(initialConnectors);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isConfigureModalVisible, setIsConfigureModalVisible] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<any>(null);
    const [addForm] = Form.useForm();
    const [configureForm] = Form.useForm();

    const handleSync = (connector: any) => {
        message.loading({ content: `Syncing ${connector.name}...`, key: 'sync' });

        // Simulate sync operation
        setTimeout(() => {
            setConnectors(connectors.map(c =>
                c.id === connector.id
                    ? { ...c, lastSync: 'Just now', status: 'connected' }
                    : c
            ));
            message.success({ content: `${connector.name} synced successfully!`, key: 'sync' });
        }, 2000);
    };

    const showConfigureModal = (connector: any) => {
        setSelectedConnector(connector);
        configureForm.setFieldsValue({
            name: connector.name,
            type: connector.type,
            apiKey: connector.apiKey || '',
            endpoint: connector.endpoint || ''
        });
        setIsConfigureModalVisible(true);
    };

    const showAddModal = () => {
        setIsAddModalVisible(true);
    };

    const handleAddConnector = () => {
        addForm.validateFields().then(values => {
            const newConnector = {
                id: `c-${Date.now()}`,
                name: values.name,
                type: values.type,
                status: 'disconnected',
                lastSync: 'Never',
                rowsImported: 0,
                apiKey: values.apiKey || '',
                endpoint: values.endpoint || ''
            };

            setConnectors([...connectors, newConnector]);
            message.success(`${newConnector.name} connector added successfully!`);
            setIsAddModalVisible(false);
            addForm.resetFields();
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleConfigureConnector = () => {
        configureForm.validateFields().then(values => {
            setConnectors(connectors.map(c =>
                c.id === selectedConnector.id
                    ? {
                        ...c,
                        name: values.name,
                        type: values.type,
                        apiKey: values.apiKey,
                        endpoint: values.endpoint
                    }
                    : c
            ));
            message.success(`${values.name} updated successfully!`);
            setIsConfigureModalVisible(false);
            setSelectedConnector(null);
            configureForm.resetFields();
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleCancelAdd = () => {
        setIsAddModalVisible(false);
        addForm.resetFields();
    };

    const handleCancelConfigure = () => {
        setIsConfigureModalVisible(false);
        setSelectedConnector(null);
        configureForm.resetFields();
    };

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
            render: (_: any, record: any) => (
                <Space>
                    <Button size="small" icon={<SyncOutlined />} onClick={() => handleSync(record)}>Sync</Button>
                    <Button size="small" onClick={() => showConfigureModal(record)}>Configure</Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card
                title="ERP Connectors"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Add Connector</Button>}
            >
                <Table dataSource={connectors} columns={columns} rowKey="id" />
            </Card>

            {/* Add Connector Modal */}
            <Modal
                title="Add New Connector"
                open={isAddModalVisible}
                onOk={handleAddConnector}
                onCancel={handleCancelAdd}
                okText="Add Connector"
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    name="add_connector_form"
                >
                    <Form.Item
                        name="name"
                        label="Connector Name"
                        rules={[{ required: true, message: 'Please enter connector name' }]}
                    >
                        <Input placeholder="e.g., Tally Prime" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Connector Type"
                        rules={[{ required: true, message: 'Please select connector type' }]}
                    >
                        <Select placeholder="Select connector type">
                            <Option value="Tally">Tally</Option>
                            <Option value="Zoho">Zoho Books</Option>
                            <Option value="SAP">SAP B1</Option>
                            <Option value="QuickBooks">QuickBooks</Option>
                            <Option value="Xero">Xero</Option>
                            <Option value="Oracle">Oracle ERP</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="apiKey"
                        label="API Key (Optional)"
                    >
                        <Input.Password placeholder="Enter API key" />
                    </Form.Item>

                    <Form.Item
                        name="endpoint"
                        label="Endpoint URL (Optional)"
                    >
                        <Input placeholder="https://api.example.com" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Configure Connector Modal */}
            <Modal
                title={`Configure ${selectedConnector?.name || 'Connector'}`}
                open={isConfigureModalVisible}
                onOk={handleConfigureConnector}
                onCancel={handleCancelConfigure}
                okText="Save Changes"
            >
                <Form
                    form={configureForm}
                    layout="vertical"
                    name="configure_connector_form"
                >
                    <Form.Item
                        name="name"
                        label="Connector Name"
                        rules={[{ required: true, message: 'Please enter connector name' }]}
                    >
                        <Input placeholder="e.g., Tally Prime" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Connector Type"
                        rules={[{ required: true, message: 'Please select connector type' }]}
                    >
                        <Select placeholder="Select connector type">
                            <Option value="Tally">Tally</Option>
                            <Option value="Zoho">Zoho Books</Option>
                            <Option value="SAP">SAP B1</Option>
                            <Option value="QuickBooks">QuickBooks</Option>
                            <Option value="Xero">Xero</Option>
                            <Option value="Oracle">Oracle ERP</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="apiKey"
                        label="API Key"
                    >
                        <Input.Password placeholder="Enter API key" />
                    </Form.Item>

                    <Form.Item
                        name="endpoint"
                        label="Endpoint URL"
                    >
                        <Input placeholder="https://api.example.com" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Connectors;
