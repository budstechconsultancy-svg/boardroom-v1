import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    FileTextOutlined,
} from '@ant-design/icons';

import { useProposals } from '../contexts/ProposalContext';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Dashboard: React.FC = () => {
    const { proposals, loading } = useProposals();

    if (loading && proposals.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} tip="Loading Dashboard..." />
            </div>
        );
    }

    // Calculate KPI data dynamically
    // Active = Currently in deliberation (Agents are working)
    const activeProposals = proposals.filter(p => p.status === 'deliberating').length;
    // Pending = Waiting for vote or CEO (Agents are done, humans/system resolving)
    const pendingApprovals = proposals.filter(p => p.status === 'voting' || p.status === 'pending_ceo').length;
    const autoExecuted = proposals.filter(p => p.status === 'approved').length;

    const completedProposals = proposals.filter(p => ['approved', 'rejected'].includes(p.status)).length;
    const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;
    const overrideRate = completedProposals > 0 ? ((rejectedProposals / completedProposals) * 100).toFixed(1) : '0';

    // Sample static data for dashboard
    const kpiData = [
        { title: 'Active Proposals', value: activeProposals, icon: <FileTextOutlined />, color: '#1890ff' },
        { title: 'Pending Approvals', value: pendingApprovals, icon: <ClockCircleOutlined />, color: '#faad14' },
        { title: 'Auto-Executed', value: autoExecuted, icon: <CheckCircleOutlined />, color: '#52c41a', suffix: 'total' },
        { title: 'Override Rate', value: overrideRate, icon: <ExclamationCircleOutlined />, color: '#ff4d4f', suffix: '%' },
    ];

    // Get recent 5 proposals
    const recentProposals = [...proposals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string | number) => `P-${id.toString().padStart(3, '0')}`
        },
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
                    rejected: { color: 'error', icon: <ExclamationCircleOutlined /> }
                };
                return <Tag icon={config[status]?.icon} color={config[status]?.color}>{status?.toUpperCase()}</Tag>;
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

export default Dashboard;
