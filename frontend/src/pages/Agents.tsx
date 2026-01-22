import React, { useState } from 'react';
import { Card, Row, Col, Avatar, Tag, Typography, Switch, Button, InputNumber, message, Modal, Input, Select, Form, Divider, Alert, Spin } from 'antd';
import { RobotOutlined, SettingOutlined, SaveOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAgents } from '../contexts/AgentContext';

const { Title, Text } = Typography;
const { Option } = Select;

const colorMap: Record<string, string> = {
    ceo: '#52c41a', hr: '#1890ff', finance: '#fa8c16', ops: '#722ed1',
    sales: '#eb2f96', legal: '#13c2c2', security: '#f5222d', procurement: '#faad14',
    customer: '#2f54eb', product: '#a0d911',
};

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Agents: React.FC = () => {
    const { agents, loading, addAgent, updateAgent, toggleAgent, refreshAgents } = useAgents();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isConfigureModalVisible, setIsConfigureModalVisible] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [createForm] = Form.useForm();
    const [configureForm] = Form.useForm();

    const handleToggle = (domain: string) => {
        toggleAgent(domain);
        const agent = agents.find(a => a.domain === domain);
        message.success(`${agent?.name} status updated`);
    };

    const handleWeightChange = (domain: string, value: number | null) => {
        if (value !== null && value >= 0 && value <= 5) {
            updateAgent(domain, { weight: value });
        }
    };

    const handleSaveAll = () => {
        refreshAgents().then(() => {
            message.success('Agent configurations synced with backend!');
        });
    };

    const showCreateModal = () => {
        setIsCreateModalVisible(true);
    };

    const showConfigureModal = (agent: any) => {
        setSelectedAgent(agent);
        configureForm.setFieldsValue({
            name: agent.name,
            description: agent.description,
            weight: agent.weight,
            canExecute: agent.canExecute,
            llmModel: agent.llmModel || 'gpt-4',
            ragEnabled: agent.ragEnabled || false,
            knowledgeBase: agent.knowledgeBase
        });
        setIsConfigureModalVisible(true);
    };

    const handleCreateAgent = () => {
        createForm.validateFields().then(async values => {
            const newAgent = {
                name: values.name,
                domain: values.domain.toLowerCase().replace(/\s+/g, '_'),
                description: values.description,
                active: true,
                weight: values.weight || 1.0,
                canExecute: values.canExecute || false,
                llmModel: 'gpt-4',
                ragEnabled: false
            };

            await addAgent(newAgent);
            message.success(`${newAgent.name} created successfully!`);
            setIsCreateModalVisible(false);
            createForm.resetFields();
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleConfigureAgent = () => {
        configureForm.validateFields().then(async values => {
            if (selectedAgent) {
                await updateAgent(selectedAgent.domain, {
                    name: values.name,
                    description: values.description,
                    weight: values.weight,
                    canExecute: values.canExecute,
                    llmModel: values.llmModel,
                    ragEnabled: values.ragEnabled,
                    knowledgeBase: values.ragEnabled ? values.knowledgeBase : undefined
                });
                message.success(`${values.name} updated successfully!`);
                setIsConfigureModalVisible(false);
                setSelectedAgent(null);
                configureForm.resetFields();
            }
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleCancelCreate = () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
    };

    const handleCancelConfigure = () => {
        setIsConfigureModalVisible(false);
        setSelectedAgent(null);
        configureForm.resetFields();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading Agents...</div>
            </div>
        );
    }

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
                <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 600 }}>CXO Agents</Title>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showCreateModal}
                        style={{ height: 40, padding: '0 24px' }}
                    >
                        Create New Agent
                    </Button>
                    <Button
                        icon={<SaveOutlined />}
                        onClick={handleSaveAll}
                        style={{ height: 40, background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                        Save Changes
                    </Button>
                </div>
            </Row>
            <Row gutter={[24, 24]}>
                {agents.map((agent) => (
                    <Col xs={24} sm={12} lg={8} key={agent.domain}>
                        <Card
                            className={`glass-card ${agent.domain === 'ceo' ? 'glass-card-active' : ''}`}
                            styles={{ body: { padding: '24px' } }}
                        >
                            <Row align="middle" gutter={16} style={{ marginBottom: 20 }}>
                                <Col>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: `linear-gradient(135deg, ${colorMap[agent.domain]}55 0%, ${colorMap[agent.domain]} 100%)`,
                                        boxShadow: `0 4px 12px ${colorMap[agent.domain]}33`
                                    }}>
                                        <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
                                    </div>
                                </Col>
                                <Col flex="auto">
                                    <Title level={5} style={{ margin: 0, color: '#fff' }}>{agent.name}</Title>
                                    <Text type="secondary" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.45)' }}>{agent.description}</Text>
                                </Col>
                            </Row>

                            <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Active</Text>
                                    <Switch
                                        checked={agent.active}
                                        size="small"
                                        onChange={() => handleToggle(agent.domain)}
                                        style={{ background: agent.active ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)' }}
                                    />
                                </Row>

                                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Vote Weight</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                        <InputNumber<number>
                                            min={0}
                                            max={5}
                                            step={0.5}
                                            value={agent.weight}
                                            onChange={(value) => handleWeightChange(agent.domain, value)}
                                            style={{ width: 60, background: 'transparent', border: 'none', color: '#fff' }}
                                            formatter={value => `${value}x`}
                                            parser={value => parseFloat(value?.replace('x', '') || '0')}
                                        />
                                    </div>
                                </Row>

                                <Row justify="space-between" align="middle">
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Can Execute</Text>
                                    <Tag
                                        style={{
                                            margin: 0,
                                            background: agent.canExecute ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                            color: agent.canExecute ? '#52c41a' : 'rgba(255, 255, 255, 0.45)',
                                            border: `1px solid ${agent.canExecute ? '#52c41a44' : 'rgba(255, 255, 255, 0.1)'}`,
                                            borderRadius: 4,
                                            padding: '0 12px'
                                        }}
                                    >
                                        {agent.canExecute ? 'Yes' : 'No'}
                                    </Tag>
                                </Row>
                            </div>

                            <Button
                                block
                                icon={<SettingOutlined />}
                                onClick={() => showConfigureModal(agent)}
                                style={{
                                    height: 38,
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    color: '#fff',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: 10
                                }}
                            >
                                Configure
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Create New Agent Modal */}
            <Modal
                title="Create New Agent"
                open={isCreateModalVisible}
                onOk={handleCreateAgent}
                onCancel={handleCancelCreate}
                okText="Create Agent"
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    name="create_agent_form"
                >
                    <Form.Item
                        name="name"
                        label="Agent Name"
                        rules={[{ required: true, message: 'Please enter agent name' }]}
                    >
                        <Input placeholder="e.g., Marketing Agent" />
                    </Form.Item>

                    <Form.Item
                        name="domain"
                        label="Domain"
                        rules={[{ required: true, message: 'Please enter domain' }]}
                    >
                        <Input placeholder="e.g., Marketing" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please enter description' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Brief description of agent's role" />
                    </Form.Item>

                    <Form.Item
                        name="weight"
                        label="Vote Weight"
                        initialValue={1.0}
                    >
                        <InputNumber<number>
                            min={0}
                            max={5}
                            step={0.5}
                            style={{ width: '100%' }}
                            formatter={value => `${value}x`}
                            parser={value => parseFloat(value?.replace('x', '') || '1')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="canExecute"
                        label="Can Execute Actions"
                        initialValue={false}
                    >
                        <Select>
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Configure Agent Modal */}
            <Modal
                title={`Configure ${selectedAgent?.name || 'Agent'}`}
                open={isConfigureModalVisible}
                onOk={handleConfigureAgent}
                onCancel={handleCancelConfigure}
                okText="Save Changes"
            >
                <Form
                    form={configureForm}
                    layout="vertical"
                    name="configure_agent_form"
                >
                    <Form.Item
                        name="name"
                        label="Agent Name"
                        rules={[{ required: true, message: 'Please enter agent name' }]}
                    >
                        <Input placeholder="e.g., Marketing Agent" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please enter description' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Brief description of agent's role" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="weight"
                                label="Vote Weight"
                            >
                                <InputNumber<number>
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}x`}
                                    parser={value => parseFloat(value?.replace('x', '') || '1')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="canExecute"
                                label="Can Execute Actions"
                            >
                                <Select>
                                    <Option value={true}>Yes</Option>
                                    <Option value={false}>No</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">AI Configuration</Divider>

                    <Form.Item
                        name="llmModel"
                        label="LLM Model"
                        initialValue="gpt-4"
                    >
                        <Select>
                            <Option value="gpt-4">GPT-4 (OpenAI)</Option>
                            <Option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</Option>
                            <Option value="claude-3-opus">Claude 3 Opus (Anthropic)</Option>
                            <Option value="gemini-pro">Gemini Pro (Google)</Option>
                        </Select>
                    </Form.Item>

                    <Alert message="RAG (Retrieval Augmented Generation) allows the agent to access external documents." type="info" showIcon style={{ marginBottom: 16 }} />

                    <Form.Item
                        name="ragEnabled"
                        label="Enable RAG"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.ragEnabled !== currentValues.ragEnabled}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('ragEnabled') ? (
                                <Form.Item
                                    name="knowledgeBase"
                                    label="Knowledge Base"
                                    rules={[{ required: true, message: 'Please select a knowledge base' }]}
                                >
                                    <Select placeholder="Select a knowledge base">
                                        <Option value="Financial Reports">Financial Reports</Option>
                                        <Option value="Legal Acts & Regulations">Legal Acts & Regulations</Option>
                                        <Option value="Corporate Strategy">Corporate Strategy</Option>
                                        <Option value="Operational Procedures">Operational Procedures</Option>
                                        <Option value="Security Protocols">Security Protocols</Option>
                                        <Option value="HR Policies">HR Policies</Option>
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Agents;
