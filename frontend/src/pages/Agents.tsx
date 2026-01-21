import React, { useState } from 'react';
import { Card, Row, Col, Avatar, Tag, Typography, Switch, Button, InputNumber, message, Modal, Input, Select, Form, Divider, Alert } from 'antd';
import { RobotOutlined, SettingOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useAgents } from '../contexts/AgentContext';

const { Title, Text } = Typography;
const { Option } = Select;

const colorMap: Record<string, string> = {
    ceo: '#52c41a', hr: '#1890ff', finance: '#fa8c16', ops: '#722ed1',
    sales: '#eb2f96', legal: '#13c2c2', security: '#f5222d', procurement: '#faad14',
    customer: '#2f54eb', product: '#a0d911',
};

const Agents: React.FC = () => {
    const { agents, addAgent, updateAgent, toggleAgent } = useAgents();
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
        // In production, this would call an API to save agent configurations
        console.log('Saving agent configurations:', agents);
        message.success('Agent configurations saved globally!');
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
        createForm.validateFields().then(values => {
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

            addAgent(newAgent);
            message.success(`${newAgent.name} created successfully!`);
            setIsCreateModalVisible(false);
            createForm.resetFields();
        }).catch(info => {
            console.log('Validate Failed:', info);
        });
    };

    const handleConfigureAgent = () => {
        configureForm.validateFields().then(values => {
            if (selectedAgent) {
                updateAgent(selectedAgent.domain, {
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

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>CXO Agents</Title>
                <div>
                    <Button
                        type="default"
                        icon={<PlusOutlined />}
                        onClick={showCreateModal}
                        style={{ marginRight: 8 }}
                    >
                        Create New Agent
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveAll}>
                        Save All Changes
                    </Button>
                </div>
            </Row>
            <Row gutter={[16, 16]}>
                {agents.map((agent) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={agent.domain}>
                        <Card hoverable>
                            <Row align="middle" gutter={12}>
                                <Col>
                                    <Avatar size={48} icon={<RobotOutlined />} style={{ backgroundColor: colorMap[agent.domain] || '#1890ff' }} />
                                </Col>
                                <Col flex="auto">
                                    <Text strong>{agent.name}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>{agent.description}</Text>
                                </Col>
                            </Row>
                            <div style={{ marginTop: 16 }}>
                                <Row justify="space-between" align="middle">
                                    <Text type="secondary">Active</Text>
                                    <Switch
                                        checked={agent.active}
                                        size="small"
                                        onChange={() => handleToggle(agent.domain)}
                                    />
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
                                    <Text type="secondary">Vote Weight</Text>
                                    <InputNumber<number>
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        value={agent.weight}
                                        onChange={(value) => handleWeightChange(agent.domain, value)}
                                        style={{ width: 80 }}
                                        formatter={value => `${value}x`}
                                        parser={value => parseFloat(value?.replace('x', '') || '0')}
                                    />
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
                                    <Text type="secondary">Can Execute</Text>
                                    <Tag color={agent.canExecute ? 'success' : 'default'}>{agent.canExecute ? 'Yes' : 'No'}</Tag>
                                </Row>
                            </div>
                            <Button
                                block
                                style={{ marginTop: 16 }}
                                icon={<SettingOutlined />}
                                onClick={() => showConfigureModal(agent)}
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
