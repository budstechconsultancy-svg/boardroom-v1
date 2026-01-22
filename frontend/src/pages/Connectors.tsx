import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Spin, Typography } from 'antd';
import { PlusOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useConnectors, Connector } from '../contexts/ConnectorContext';

const { Option } = Select;
const { Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Connectors: React.FC = () => {
    const { connectors, loading, addConnector, updateConnector, syncConnector } = useConnectors();
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isConfigureModalVisible, setIsConfigureModalVisible] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
    const [addForm] = Form.useForm();
    const [configureForm] = Form.useForm();

    const handleSync = async (connector: Connector) => {
        const hide = message.loading(`Syncing ${connector.name}...`, 0);
        try {
            await syncConnector(connector.id);
            message.success(`${connector.name} synced successfully!`);
        } catch (error) {
            message.error(`Failed to sync ${connector.name}`);
        } finally {
            hide();
        }
    };

    const showConfigureModal = (connector: Connector) => {
        setSelectedConnector(connector);
        configureForm.setFieldsValue({
            name: connector.name,
            type: connector.type,
            apiKey: connector.config.apiKey || '',
            endpoint: connector.config.endpoint || ''
        });
        setIsConfigureModalVisible(true);
    };

    const showAddModal = () => {
        setIsAddModalVisible(true);
    };

    const handleAddConnector = () => {
        addForm.validateFields().then(async values => {
            const newConnector: Partial<Connector> = {
                name: values.name,
                type: values.type,
                status: 'disconnected',
                config: {
                    apiKey: values.apiKey || '',
                    endpoint: values.endpoint || '',
                    rowsImported: 0
                }
            };

            await addConnector(newConnector);
            message.success(`${values.name} connector added successfully!`);
            setIsAddModalVisible(false);
            addForm.resetFields();
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleConfigureConnector = () => {
        configureForm.validateFields().then(async values => {
            if (selectedConnector) {
                await updateConnector(selectedConnector.id, {
                    name: values.name,
                    type: values.type,
                    config: {
                        ...selectedConnector.config,
                        apiKey: values.apiKey,
                        endpoint: values.endpoint
                    }
                });
                message.success(`${values.name} updated successfully!`);
                setIsConfigureModalVisible(false);
                setSelectedConnector(null);
                configureForm.resetFields();
            }
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
        { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text style={{ color: '#fff', fontWeight: 500 }}>{text}</Text> },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}>{t}</Tag> },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag
                    icon={s === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={s === 'connected' ? 'success' : 'error'}
                    style={{ background: 'transparent' }}
                >
                    {s.toUpperCase()}
                </Tag>
            ),
        },
        { title: 'Last Sync', dataIndex: 'lastSync', key: 'lastSync', render: (t: string) => <Text type="secondary">{t}</Text> },
        { title: 'Rows', dataIndex: 'rowsImported', key: 'rowsImported', render: (n: number) => <Text style={{ color: '#8b5cf6' }}>{n.toLocaleString()}</Text> },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Connector) => (
                <Space>
                    <Button
                        size="small"
                        icon={<SyncOutlined />}
                        onClick={() => handleSync(record)}
                        style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}
                    >
                        Sync
                    </Button>
                    <Button
                        size="small"
                        onClick={() => showConfigureModal(record)}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                    >
                        Configure
                    </Button>
                </Space>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#8b5cf6' }} spin />} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Establishing ERP Handshakes...</div>
            </div>
        );
    }

    return (
        <>
            <Card
                className="glass-card"
                title={<span style={{ color: '#fff' }}>Strategic Data Connectors</span>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Add Link</Button>}
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={connectors}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    style={{ padding: '0 24px 24px 24px' }}
                />
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
