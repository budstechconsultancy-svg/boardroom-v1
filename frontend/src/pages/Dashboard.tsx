import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
    // Sample data for dashboard
    const kpiData = [
        { title: 'Active Proposals', value: 12, icon: <FileTextOutlined />, color: '#1890ff' },
        { title: 'Pending Approvals', value: 5, icon: <ClockCircleOutlined />, color: '#faad14' },
        { title: 'Auto-Executed', value: 45, icon: <CheckCircleOutlined />, color: '#52c41a', suffix: 'this month' },
        { title: 'Override Rate', value: 8.5, icon: <ExclamationCircleOutlined />, color: '#ff4d4f', suffix: '%' },
    ];

    const recentProposals = [
        { id: 'P-001', title: 'Q1 Budget Reallocation', domain: 'Finance', status: 'approved', confidence: 0.92 },
        { id: 'P-002', title: 'New Hire: Senior Developer', domain: 'HR', status: 'voting', confidence: 0.85 },
        { id: 'P-003', title: 'Inventory Optimization', domain: 'Ops', status: 'deliberating', confidence: 0.78 },
        { id: 'P-004', title: 'Vendor Contract Renewal', domain: 'Procurement', status: 'pending', confidence: 0.65 },
    ];

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Title', dataIndex: 'title', key: 'title' },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: (domain: string) => (
                <Tag color={
                    domain === 'Finance' ? 'orange' :
                        domain === 'HR' ? 'blue' :
                            domain === 'Ops' ? 'purple' : 'green'
                }>
                    {domain}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: Record<string, { color: string; icon: React.ReactNode }> = {
                    approved: { color: 'success', icon: <CheckCircleOutlined /> },
                    voting: { color: 'processing', icon: <SyncOutlined spin /> },
                    deliberating: { color: 'warning', icon: <ClockCircleOutlined /> },
                    pending: { color: 'default', icon: <ClockCircleOutlined /> },
                };
                return <Tag icon={config[status]?.icon} color={config[status]?.color}>{status}</Tag>;
            },
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (val: number) => (
                <Progress
                    percent={val * 100}
                    size="small"
                    status={val >= 0.8 ? 'success' : val >= 0.6 ? 'normal' : 'exception'}
                    format={(p) => `${p?.toFixed(0)}%`}
                />
            ),
        },
    ];

    return (
        <div>
            <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

            {/* KPI Tiles */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {kpiData.map((kpi, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className="dashboard-card">
                            <Statistic
                                title={kpi.title}
                                value={kpi.value}
                                suffix={kpi.suffix}
                                valueStyle={{ color: kpi.color }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Performance Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Decision Accuracy" className="dashboard-card">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Statistic
                                    value={95.2}
                                    suffix="%"
                                    valueStyle={{ color: '#52c41a' }}
                                    prefix={<ArrowUpOutlined />}
                                />
                            </Col>
                            <Col>
                                <Text type="secondary">+2.3% from last month</Text>
                            </Col>
                        </Row>
                        <Progress percent={95.2} status="success" showInfo={false} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Avg. Decision Time" className="dashboard-card">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Statistic
                                    value={4.2}
                                    suffix="min"
                                    valueStyle={{ color: '#1890ff' }}
                                    prefix={<ArrowDownOutlined />}
                                />
                            </Col>
                            <Col>
                                <Text type="secondary">-30% faster than manual</Text>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Recent Proposals */}
            <Card title="Recent Proposals" className="dashboard-card">
                <Table
                    dataSource={recentProposals}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                />
            </Card>
        </div>
    );
};

// Import for icon
import { FileTextOutlined } from '@ant-design/icons';

export default Dashboard;
