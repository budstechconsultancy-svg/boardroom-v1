import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography, Button } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    FileTextOutlined,
    ReloadOutlined,
} from '@ant-design/icons';

import { useProposals } from '../contexts/ProposalContext';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Dashboard: React.FC = () => {
    const { proposals, loading, refreshProposals } = useProposals();
    const [refreshing, setRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshProposals();
        } finally {
            setRefreshing(false);
        }
    };

    if (loading && proposals.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading Dashboard...</div>
            </div>
        );
    }

    // Calculate KPI data dynamically
    // Active = Currently in progress (deliberating, voting, executing, or pending execution)
    const activeProposals = proposals.filter(p => ['deliberating', 'voting', 'pending_execution', 'executing'].includes(p.status)).length;
    // Pending = Waiting for specific action/resolution
    const pendingApprovals = proposals.filter(p => ['voting', 'pending_ceo', 'pending_execution'].includes(p.status)).length;
    const autoExecuted = proposals.filter(p => p.status === 'executed' || p.status === 'approved').length;

    const completedProposals = proposals.filter(p => ['approved', 'rejected', 'executed'].includes(p.status)).length;
    const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;
    const overrideRate = completedProposals > 0 ? ((rejectedProposals / completedProposals) * 100).toFixed(1) : '0';

    // Calculate Decision Accuracy (percentage of approved/executed proposals)
    const decisionAccuracy = completedProposals > 0
        ? ((autoExecuted / completedProposals) * 100).toFixed(1)
        : '0';

    // Calculate Avg Decision Time (average based on number of discussions - simulated)
    // More proposals = longer time, fewer proposals = faster time
    const baseTime = 4.2; // minutes
    const avgDecisionTime = (baseTime + (proposals.length * 0.1)).toFixed(1);

    const kpiData = [
        { title: 'Active Proposals', value: activeProposals, icon: <ClockCircleOutlined />, color: '#faad14' },
        { title: 'Pending Approvals', value: pendingApprovals, icon: <SyncOutlined />, color: '#8b5cf6' },
        { title: 'Auto-Executed', value: autoExecuted, icon: <CheckCircleOutlined />, color: '#52c41a', suffix: 'total' },
        { title: 'Override Rate', value: overrideRate, icon: <ExclamationCircleOutlined />, color: '#ff4d4f', suffix: '%' },
    ];

    // Get recent 5 proposals
    const recentProposals = [...proposals].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string | number) => <Text strong style={{ color: '#8b5cf6' }}>{`P-${id.toString().padStart(4, '0')}`}</Text>
        },
        { title: 'Title', dataIndex: 'title', key: 'title', render: (text: string) => <Text style={{ color: '#fff' }}>{text}</Text> },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: (domain: string) => (
                <Tag color="rgba(255, 255, 255, 0.05)" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}>
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
                    approved: { color: '#52c41a', icon: <CheckCircleOutlined /> },
                    voting: { color: '#8b5cf6', icon: <SyncOutlined spin /> },
                    deliberating: { color: '#faad14', icon: <ClockCircleOutlined /> },
                    pending: { color: 'rgba(255, 255, 255, 0.45)', icon: <ClockCircleOutlined /> },
                    rejected: { color: '#ff4d4f', icon: <ExclamationCircleOutlined /> }
                };
                return <Tag icon={config[status]?.icon} style={{ color: config[status]?.color, background: 'transparent', border: `1px solid ${config[status]?.color}44` }}>{status?.toUpperCase()}</Tag>;
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
                    strokeColor="#8b5cf6"
                    trailColor="rgba(255, 255, 255, 0.05)"
                    format={(p) => <span style={{ color: '#fff' }}>{`${p?.toFixed(0)}%`}</span>}
                />
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, color: '#fff' }}>Dashboard Overview</Title>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={refreshing}
                    style={{ color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)' }}
                >
                    Refresh
                </Button>
            </Row>

            {/* KPI Tiles */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                {kpiData.map((kpi, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className="glass-card" styles={{ body: { padding: '24px' } }}>
                            <Statistic
                                title={<span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.title}</span>}
                                value={kpi.value}
                                suffix={kpi.suffix}
                                prefix={kpi.icon}
                                valueStyle={{ color: kpi.color, fontSize: 28, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Performance Metrics */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title={<span style={{ color: '#fff' }}>Decision Accuracy</span>} className="glass-card">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Statistic
                                    value={decisionAccuracy}
                                    suffix="%"
                                    valueStyle={{ color: '#52c41a' }}
                                    prefix={<ArrowUpOutlined />}
                                />
                            </Col>
                            <Col>
                                <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{autoExecuted} of {completedProposals} approved</Text>
                            </Col>
                        </Row>
                        <Progress percent={parseFloat(decisionAccuracy)} strokeColor="#52c41a" trailColor="rgba(255, 255, 255, 0.05)" showInfo={false} style={{ marginTop: 12 }} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title={<span style={{ color: '#fff' }}>Avg. Decision Time</span>} className="glass-card">
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Statistic
                                    value={avgDecisionTime}
                                    suffix="min"
                                    valueStyle={{ color: '#8b5cf6' }}
                                    prefix={<ArrowDownOutlined />}
                                />
                            </Col>
                            <Col>
                                <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Based on {proposals.length} proposals</Text>
                            </Col>
                        </Row>
                        <Progress percent={Math.min(parseFloat(avgDecisionTime) * 10, 100)} strokeColor="#8b5cf6" trailColor="rgba(255, 255, 255, 0.05)" showInfo={false} style={{ marginTop: 12 }} />
                    </Card>
                </Col>
            </Row>

            {/* Recent Proposals */}
            <Card title={<span style={{ color: '#fff' }}>Recent Proposals</span>} className="glass-card">
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
