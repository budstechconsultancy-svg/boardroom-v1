import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Row, Col, Tag, Progress, Button, Collapse, Timeline, Avatar, Divider, Typography, Space, Alert, Spin, message, Modal, Input } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    QuestionCircleOutlined,
    UserOutlined,
    RobotOutlined,
    FileTextOutlined,
    PrinterOutlined,
    DownloadOutlined,
    SyncOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ProposalDetail: React.FC = () => {
    const { id } = useParams();
    const location = useLocation();
    const [simulating, setSimulating] = useState(false);

    // Default sample data (fallback)
    const defaultProposal = {
        id: id || 'P-001',
        title: 'Q1 Budget Reallocation for Marketing',
        description: 'Proposal to reallocate $50,000 from unused training budget to marketing initiatives for Q1 campaign.',
        status: 'voting',
        riskTier: 'medium',
        confidence: 0.87,
        domain: 'Finance',
        proposer: 'Finance Agent',
        createdAt: '2024-01-15T10:30:00Z',
        impactSummary: 'Increased marketing reach expected to generate 15% more leads with 2.5x ROI.',
    };

    // Use passed state or fallback, leveraging URL ID if state is missing
    const initialProposal = location.state?.proposal ? {
        ...defaultProposal,
        ...location.state.proposal,
        description: location.state.proposal.description || defaultProposal.description
    } : {
        ...defaultProposal,
        id: id || defaultProposal.id,
        title: id && id !== defaultProposal.id ? `Proposal ${id} (Restored)` : defaultProposal.title,
        description: id && id !== defaultProposal.id ? 'Data not found in local state (refresh detected). Using default mock data.' : defaultProposal.description
    };

    const [proposal, setProposal] = useState(initialProposal);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [infoRequest, setInfoRequest] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);

    const handleRequestMoreInfo = () => {
        setIsInfoModalVisible(true);
    };

    const submitInfoRequest = () => {
        if (!infoRequest.trim()) {
            message.error('Please enter your question or request');
            return;
        }
        setRequestLoading(true);
        setTimeout(() => {
            setRequestLoading(false);
            setIsInfoModalVisible(false);
            setInfoRequest('');
            message.success('Request sent to CXO Agents. You will be notified when they respond.');
        }, 1500);
    };

    const handleApprove = () => {
        setProposal({ ...proposal, status: 'approved' });
        message.success('Proposal approved and executed successfully.');
    };

    const handleReject = () => {
        setProposal({ ...proposal, status: 'rejected' });
        message.info('Proposal rejected.');
    };

    // Simulation effect for new proposals
    useEffect(() => {
        if (proposal.status === 'deliberating') {
            setSimulating(true);
            const timer = setTimeout(() => {
                setSimulating(false);
                setProposal(prev => ({ ...prev, status: 'voting' }));
                message.success('Agent review completed. Voting session started.');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const evidenceMap: Record<string, any[]> = {
        'P-001': [
            { source: 'GL Data', excerpt: 'Training budget utilization at 45% with 3 months remaining', relevance: 0.95 },
            { source: 'Marketing Reports', excerpt: 'Q4 campaign achieved 180% of lead target', relevance: 0.89 },
            { source: 'Financial Policy', excerpt: 'Budget transfers allowed within fiscal year with CFO approval', relevance: 0.92 },
        ],
        'P-002': [
            { source: 'HR Metrics', excerpt: 'Engineering team capacity utilization at 110% for last 3 sprints', relevance: 0.94 },
            { source: 'Product Roadmap', excerpt: 'Q2 feature delivery at risk due to resource constraints', relevance: 0.88 },
            { source: 'Market Analysis', excerpt: 'Senior Dev salaries increased by 8% y-o-y', relevance: 0.82 },
        ],
        'P-003': [
            { source: 'Inventory Logs', excerpt: 'Average holding time increased from 15 to 22 days', relevance: 0.91 },
            { source: 'Sales Forecast', excerpt: 'Seasonal demand fluctuation requires dynamic stocking', relevance: 0.85 },
            { source: 'Tech Vendor Specs', excerpt: 'AI system promises 12-18% cost reduction in pilots', relevance: 0.93 },
        ],
        'P-004': [
            { source: 'Contract Terms', excerpt: 'Draft contract includes clause for 15% discount on 3-year term', relevance: 0.96 },
            { source: 'Usage Stats', excerpt: 'Cloud compute usage growing 10% month-over-month', relevance: 0.90 },
            { source: 'Budget Outlook', excerpt: 'Long-term commitment aligns with Capex strategy', relevance: 0.87 },
        ],
    };

    const votesMap: Record<string, any[]> = {
        'P-001': [
            { agent: 'HR Agent', vote: 'approve', rationale: 'No impact on mandatory training programs', confidence: 0.85 },
            { agent: 'Finance Agent', vote: 'approve', rationale: 'Within budget transfer policy, positive ROI expected', confidence: 0.92 },
            { agent: 'Ops Agent', vote: 'abstain', rationale: 'No operational impact identified', confidence: 0.75 },
            { agent: 'Legal Agent', vote: 'approve', rationale: 'No compliance concerns identified', confidence: 0.88 },
        ],
        'P-002': [
            { agent: 'HR Agent', vote: 'approve', rationale: 'Critical need for roadmap execution', confidence: 0.95 },
            { agent: 'Finance Agent', vote: 'reject', rationale: 'Exceeds Q1 hiring budget by 15%', confidence: 0.82 },
            { agent: 'Ops Agent', vote: 'approve', rationale: 'Will alleviate bottleneck in product delivery', confidence: 0.88 },
            { agent: 'Legal Agent', vote: 'approve', rationale: 'Standard employment contract applies', confidence: 0.90 },
        ],
        'P-003': [
            { agent: 'HR Agent', vote: 'abstain', rationale: 'Minimal workforce impact expected', confidence: 0.70 },
            { agent: 'Finance Agent', vote: 'approve', rationale: 'ROI positive within 9 months', confidence: 0.89 },
            { agent: 'Ops Agent', vote: 'approve', rationale: 'Crucial for meeting efficiency targets', confidence: 0.94 },
            { agent: 'Legal Agent', vote: 'abstain', rationale: 'Waiting for data privacy review', confidence: 0.65 },
        ],
        'P-004': [
            { agent: 'HR Agent', vote: 'abstain', rationale: 'N/A', confidence: 0.60 },
            { agent: 'Finance Agent', vote: 'approve', rationale: 'Significant long-term savings', confidence: 0.93 },
            { agent: 'Ops Agent', vote: 'approve', rationale: 'Guarantees infrastructure stability', confidence: 0.91 },
            { agent: 'Legal Agent', vote: 'approve', rationale: 'Terms are standard and favorable', confidence: 0.89 },
        ],
    };

    // Fallback for new simulated proposals
    const defaultEvidence = [
        { source: 'Corporate Policy', excerpt: 'Standard operating procedure for this domain', relevance: 0.85 },
        { source: 'Historical Data', excerpt: 'Similar proposals have showed positive trend', relevance: 0.80 },
    ];
    const defaultVotes = [
        { agent: 'HR Agent', vote: 'approve', rationale: 'Aligns with people strategy', confidence: 0.85 },
        { agent: 'Finance Agent', vote: 'approve', rationale: 'Within budget limits', confidence: 0.88 },
        { agent: 'Ops Agent', vote: 'approve', rationale: 'Operationally feasible', confidence: 0.90 },
        { agent: 'Legal Agent', vote: 'approve', rationale: 'No compliance risks', confidence: 0.92 },
    ];

    const evidence = evidenceMap[proposal.id] || defaultEvidence;
    const agentVotes = votesMap[proposal.id] || defaultVotes;

    const rounds = [
        { round: 1, phase: 'Proposal', summary: `${proposal.domain} Agent submitted initial proposal with evidence` },
        { round: 2, phase: 'Challenge', summary: 'HR Agent raised concern about training impact - resolved' },
        { round: 3, phase: 'Voting', summary: 'All agents submitted votes, awaiting CEO decision' },
    ];

    return (
        <div>
            {/* Header Card */}
            <Card
                className="decision-card pending"
                style={{ marginBottom: 16 }}
                extra={
                    <Space>
                        <Button icon={<PrinterOutlined />}>Print</Button>
                        <Button icon={<DownloadOutlined />}>Export PDF</Button>
                    </Space>
                }
            >
                <Row gutter={[24, 16]}>
                    <Col span={16}>
                        <Title level={4} style={{ marginBottom: 8 }}>{proposal.title}</Title>
                        <Space size="middle">
                            <Tag color="blue">{proposal.domain}</Tag>
                            <Tag color={proposal.riskTier === 'high' ? 'red' : proposal.riskTier === 'medium' ? 'orange' : 'green'}>
                                {proposal.riskTier ? proposal.riskTier.toUpperCase() : 'MEDIUM'} RISK
                            </Tag>
                            <Tag color="processing" icon={proposal.status === 'deliberating' ? <SyncOutlined spin /> : null}>
                                {proposal.status.toUpperCase()}
                            </Tag>
                        </Space>
                        <Paragraph style={{ marginTop: 12 }}>{proposal.description}</Paragraph>

                        {proposal.status === 'deliberating' && (
                            <Alert
                                message="Agent Review in Progress"
                                description="The CXO Council agents are currently analyzing this proposal against their respective knowledge bases (HR, Finance, Legal, Ops) and retrieving relevant evidence."
                                type="info"
                                showIcon
                                icon={<RobotOutlined spin />}
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </Col>
                    <Col span={8}>
                        <Card size="small" title="Confidence Score">
                            <Progress
                                type="dashboard"
                                percent={proposal.confidence * 100}
                                format={(p) => `${p?.toFixed(0)}%`}
                                status={proposal.confidence >= 0.8 ? 'success' : 'normal'}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>

            <Row gutter={16}>
                {/* Evidence Panel */}
                <Col span={12}>
                    <Card title="📋 Evidence References" style={{ marginBottom: 16 }}>
                        {proposal.status === 'deliberating' && simulating ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <Spin tip="Retrieving evidence from vector store..." />
                            </div>
                        ) : (
                            evidence.map((e, i) => (
                                <Card size="small" key={i} style={{ marginBottom: 8 }}>
                                    <Text strong>{e.source}</Text>
                                    <Tag style={{ float: 'right' }}>{(e.relevance * 100).toFixed(0)}% relevant</Tag>
                                    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                                        "{e.excerpt}"
                                    </Paragraph>
                                </Card>
                            ))
                        )}
                    </Card>
                </Col>

                {/* Agent Votes */}
                <Col span={12}>
                    <Card title="🗳️ Agent Votes" style={{ marginBottom: 16 }}>
                        {proposal.status === 'deliberating' ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                                <RobotOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                <p>Agents are deliberating... Votes pending.</p>
                            </div>
                        ) : (
                            agentVotes.map((v, i) => (
                                <Card size="small" key={i} style={{ marginBottom: 8 }}>
                                    <Row align="middle">
                                        <Col span={8}>
                                            <Space>
                                                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                                <Text strong>{v.agent}</Text>
                                            </Space>
                                        </Col>
                                        <Col span={8}>
                                            <Tag
                                                icon={
                                                    v.vote === 'approve' ? <CheckCircleOutlined /> :
                                                        v.vote === 'reject' ? <CloseCircleOutlined /> :
                                                            <QuestionCircleOutlined />
                                                }
                                                color={v.vote === 'approve' ? 'success' : v.vote === 'reject' ? 'error' : 'default'}
                                            >
                                                {v.vote.toUpperCase()}
                                            </Tag>
                                        </Col>
                                        <Col span={8}>
                                            <Text type="secondary">{(v.confidence * 100).toFixed(0)}% confident</Text>
                                        </Col>
                                    </Row>
                                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                        {v.rationale}
                                    </Text>
                                </Card>
                            ))
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Deliberation Timeline */}
            <Card title="⏱️ Deliberation Rounds">
                <Timeline>
                    {rounds.map((r, i) => (
                        <Timeline.Item key={i} color={i === rounds.length - 1 ? 'blue' : 'green'}>
                            <Text strong>Round {r.round}: {r.phase}</Text>
                            <br />
                            <Text type="secondary">{r.summary}</Text>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Card>

            {/* Action Buttons */}
            <Card style={{ marginTop: 16 }}>
                <Space size="large">
                    <Button type="primary" size="large" icon={<CheckCircleOutlined />} disabled={proposal.status === 'deliberating'} onClick={handleApprove}>
                        Approve & Execute
                    </Button>
                    <Button danger size="large" icon={<CloseCircleOutlined />} disabled={proposal.status === 'deliberating'} onClick={handleReject}>
                        Reject
                    </Button>
                    <Button size="large" onClick={handleRequestMoreInfo}>Request More Info</Button>
                </Space>
            </Card>

            <Modal
                title="Request More Information"
                open={isInfoModalVisible}
                onOk={submitInfoRequest}
                onCancel={() => setIsInfoModalVisible(false)}
                confirmLoading={requestLoading}
                okText="Send Request"
            >
                <Paragraph>
                    Specify what additional information you need from the agents. They will query the knowledge base and update the proposal evidence.
                </Paragraph>
                <Input.TextArea
                    rows={4}
                    placeholder="e.g., Can you verify the legal implications of this clause?"
                    value={infoRequest}
                    onChange={(e) => setInfoRequest(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default ProposalDetail;
