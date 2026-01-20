import React from 'react';
import { Card, Row, Col, Avatar, Tag, Progress, Typography, Switch, Button } from 'antd';
import { RobotOutlined, SettingOutlined, PoweroffOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const agents = [
    { name: 'CEO Agent', domain: 'ceo', description: 'Final authority - AI/Human/Hybrid', active: true, weight: 2.0, canExecute: true },
    { name: 'HR Agent', domain: 'hr', description: 'Workforce and HR decisions', active: true, weight: 1.0, canExecute: true },
    { name: 'Finance Agent', domain: 'finance', description: 'Financial decisions and controls', active: true, weight: 1.5, canExecute: true },
    { name: 'Ops Agent', domain: 'ops', description: 'Operations and efficiency', active: true, weight: 1.0, canExecute: true },
    { name: 'Sales Agent', domain: 'sales', description: 'Revenue and sales decisions', active: false, weight: 1.0, canExecute: false },
    { name: 'Legal Agent', domain: 'legal', description: 'Compliance and legal review', active: true, weight: 1.5, canExecute: false },
    { name: 'IT Security Agent', domain: 'security', description: 'Security and access control', active: true, weight: 1.0, canExecute: false },
    { name: 'Procurement Agent', domain: 'procurement', description: 'Vendor and supply decisions', active: false, weight: 1.0, canExecute: true },
    { name: 'Customer Success', domain: 'customer', description: 'Customer retention', active: false, weight: 1.0, canExecute: false },
    { name: 'Product Agent', domain: 'product', description: 'Product roadmap', active: false, weight: 1.0, canExecute: false },
];

const colorMap: Record<string, string> = {
    ceo: '#52c41a', hr: '#1890ff', finance: '#fa8c16', ops: '#722ed1',
    sales: '#eb2f96', legal: '#13c2c2', security: '#f5222d', procurement: '#faad14',
    customer: '#2f54eb', product: '#a0d911',
};

const Agents: React.FC = () => {
    return (
        <div>
            <Title level={4}>CXO Agents</Title>
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
                                    <Switch checked={agent.active} size="small" />
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
                                    <Text type="secondary">Vote Weight</Text>
                                    <Tag>{agent.weight}x</Tag>
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
                                    <Text type="secondary">Can Execute</Text>
                                    <Tag color={agent.canExecute ? 'success' : 'default'}>{agent.canExecute ? 'Yes' : 'No'}</Tag>
                                </Row>
                            </div>
                            <Button block style={{ marginTop: 16 }} icon={<SettingOutlined />}>Configure</Button>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default Agents;
