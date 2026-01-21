import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Row, Col, Tag, Progress, Button, Collapse, Timeline, Avatar, Divider, Typography, Space, Alert, Spin, message, Modal, Input, Tooltip } from 'antd';
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
    CarryOutOutlined,
    MessageOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { useProposals } from '../contexts/ProposalContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ProposalDetail: React.FC = () => {
    const { id } = useParams();
    const { proposals, deliberations, votes, updateProposalStatus, generateDeliberation, getDeliberation } = useProposals();
    const [simulating, setSimulating] = useState(false);

    // Find the proposal from context
    const proposal = proposals.find(p => p.id === id);

    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [infoRequest, setInfoRequest] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const { addInfoRequest } = useProposals();

    // Ensure deliberation data exists or generate it if missing (for deep links/refreshes)
    useEffect(() => {
        if (proposal && !deliberations[proposal.id]) {
            generateDeliberation(proposal);
        }
    }, [proposal, deliberations, generateDeliberation]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const rounds = proposal ? getDeliberation(proposal.id) : [];

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [rounds]);

    // Handle case where proposal is not found (e.g. invalid URL)
    if (!proposal) {
        return <Alert message="Proposal Not Found" description="The requested proposal could not be retrieved." type="error" />;
    }

    // rounds is already defined above
    const agentVotes = votes[proposal.id] || [];
    const conclusionStatement = rounds[rounds.length - 1]?.conclusion;

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
            addInfoRequest(proposal.id, infoRequest);
            setRequestLoading(false);
            setIsInfoModalVisible(false);
            setInfoRequest('');
            message.success('Request sent to Agents. Deliberation continuing...');
        }, 1000);
    };

    const handleApprove = () => {
        updateProposalStatus(proposal.id, 'approved');
        message.success('Proposal approved and executed successfully.');
    };

    const handleReject = () => {
        updateProposalStatus(proposal.id, 'rejected');
        message.info('Proposal rejected.');
    };

    // Simulation effect for new proposals in 'deliberating' state
    useEffect(() => {
        if (proposal.status === 'deliberating') {
            setSimulating(true);
            const timer = setTimeout(() => {
                setSimulating(false);
                // In a real app, backend would push this status change. 
                // Here we simulate the transition to voting after 3s "deliberation" view
                updateProposalStatus(proposal.id, 'voting');
                message.success('Agent review completed. Voting session started.');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [proposal.status, updateProposalStatus, proposal.id]); // Only run if status changes to deliberating, or acts as logic for initial load

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
        // Falls back to generic evidence for new proposals
    };

    // Fallback for new simulated proposals
    const defaultEvidence = [
        { source: 'Corporate Policy', excerpt: 'Standard operating procedure for this domain', relevance: 0.85 },
        { source: 'Historical Data', excerpt: 'Similar proposals have showed positive trend', relevance: 0.80 },
    ];

    const evidence = evidenceMap[proposal.id] || defaultEvidence;

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        message.info('Opening print dialog - select "Save as PDF" to export');
        window.print();
    };

    // Color mapper for agent domains
    const getAgentColor = (domain: string) => {
        const colors: Record<string, string> = {
            'Finance': '#1890ff',
            'HR': '#eb2f96',
            'Operations': '#52c41a',
            'Legal': '#faad14',
            'Sales': '#722ed1',
            'Procurement': '#fa541c'
        };
        return colors[domain] || '#1890ff';
    };

    // Participating Agents (All 4 standard agents + potentially the Proposer if different)
    // For now we assume standard 4
    const participatingAgents = [
        { name: 'Finance Agent', domain: 'Finance' },
        { name: 'HR Agent', domain: 'HR' },
        { name: 'Ops Agent', domain: 'Operations' },
        { name: 'Legal Agent', domain: 'Legal' }
    ];

    return (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header Card - Fixed at top */}
            <div style={{ flexShrink: 0, marginBottom: 16 }}>
                <Card
                    className="decision-card pending"
                    bodyStyle={{ padding: '12px 24px' }}
                    extra={
                        <Space>
                            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
                            <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>Export PDF</Button>
                        </Space>
                    }
                >
                    <Row gutter={[24, 16]} align="middle">
                        <Col span={16}>
                            <Space size="middle" align="baseline">
                                <Title level={4} style={{ marginBottom: 0 }}>{proposal.title}</Title>
                                <Tag color="blue">{proposal.domain}</Tag>
                                <Tag color={proposal.riskTier === 'high' ? 'red' : proposal.riskTier === 'medium' ? 'orange' : 'green'}>
                                    {proposal.riskTier ? proposal.riskTier.toUpperCase() : 'MEDIUM'} RISK
                                </Tag>
                                <Tag color="processing" icon={proposal.status === 'deliberating' ? <SyncOutlined spin /> : null}>
                                    {proposal.status.toUpperCase()}
                                </Tag>
                            </Space>
                            <Paragraph style={{ marginTop: 8, marginBottom: 0 }} ellipsis={{ rows: 2 }}>{proposal.description}</Paragraph>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Space>
                                <div style={{ textAlign: 'right', marginRight: 16 }}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Confidence Score</Text>
                                    <Text strong style={{ fontSize: 18, color: proposal.confidence >= 0.8 ? '#52c41a' : '#faad14' }}>
                                        {(proposal.confidence * 100).toFixed(0)}%
                                    </Text>
                                </div>
                                <Progress
                                    type="circle"
                                    percent={proposal.confidence * 100}
                                    width={50}
                                    format={() => null}
                                    status={proposal.confidence >= 0.8 ? 'success' : 'normal'}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>
            </div>

            {/* Main Content Area - Scrollable */}
            <Row gutter={16} style={{ flex: 1, overflow: 'hidden' }}>
                {/* Chat Interface (Left - 16) - Takes remaining height */}
                <Col span={16} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        title={<span><MessageOutlined /> Agent Deliberation Chat</span>}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 24px 24px', overflow: 'hidden' }}
                    >
                        {/* Scrollable Chat Container */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            <Timeline mode="left" style={{ marginTop: 24 }}>
                                {rounds.map((r, i) => (
                                    <Timeline.Item key={i} color={i === rounds.length - 1 ? 'blue' : 'green'} label={`Round ${r.round}`}>
                                        <div style={{ marginBottom: 24 }}>
                                            <Tag color="geekblue" style={{ marginBottom: 16 }}>{r.phase}</Tag>

                                            {r.conversations?.map((conv, idx) => (
                                                <div key={idx} style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
                                                    <Avatar
                                                        icon={<RobotOutlined />}
                                                        style={{ backgroundColor: getAgentColor(conv.domain || 'Finance'), marginRight: 12, minWidth: 32 }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                            <Text strong style={{ marginRight: 8 }}>{conv.agent}</Text>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>{conv.timestamp}</Text>
                                                            {conv.isChallenge && <Tag color="error" style={{ marginLeft: 8 }}>Challenge</Tag>}
                                                            {conv.isResponse && <Tag color="success" style={{ marginLeft: 8 }}>Response</Tag>}
                                                            {/* Display Evidence if Attached */}
                                                            {conv.evidence && (
                                                                <Tooltip title="Evidence Provided">
                                                                    <FileTextOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            background: conv.isChallenge ? '#fff1f0' : conv.isResponse ? '#f6ffed' : '#e6f7ff',
                                                            padding: '10px 14px',
                                                            borderRadius: '0 12px 12px 12px',
                                                            border: '1px solid #f0f0f0',
                                                            display: 'inline-block',
                                                            maxWidth: '90%'
                                                        }}>
                                                            <Text>{conv.message}</Text>
                                                            {conv.evidence && (
                                                                <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 4, border: '1px dashed #d9d9d9' }}>
                                                                    <div style={{ fontSize: 11, fontWeight: 'bold', color: '#666' }}>
                                                                        <FileTextOutlined /> EVIDENCE SUBMITTED
                                                                    </div>
                                                                    <Text type="secondary" style={{ fontSize: 11 }}>{conv.evidence}</Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {r.conclusion && (
                                                <Alert
                                                    message="Round Conclusion"
                                                    description={r.conclusion}
                                                    type="success"
                                                    showIcon
                                                    style={{ marginTop: 16 }}
                                                />
                                            )}
                                        </div>
                                    </Timeline.Item>
                                ))}
                                <div ref={chatEndRef} />
                            </Timeline>
                        </div>

                        {/* Status Footer inside Chat Card */}
                        {proposal.status === 'deliberating' && (
                            <div style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px dashed #eee', marginTop: 16 }}>
                                <Spin tip={`Round ${rounds.length + 1} in progress...`} />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Evidence & Final Voting (Right - 8) - Scrollable Column */}
                <Col span={8} style={{ height: '100%', overflowY: 'auto', paddingBottom: 16 }}>

                    {/* Agents Grid - Moved here or kept? The user didn't specify, but I'll keeping it compact or move it to top if needed. 
                        For now, let's keep it but maybe compact it to fit better in the right column if the user wants "conversation in scrollable within page".
                        Wait, the original layout had Agent Overview above. 
                        I will move Agent Status to a smaller card at the top of the right column.
                    */}

                    <Card title="Participating Agents" size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={[8, 8]}>
                            {participatingAgents.map((agent, index) => {
                                const vote = agentVotes.find(v => v.domain === agent.domain);
                                return (
                                    <Col span={24} key={index}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Space>
                                                <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: getAgentColor(agent.domain) }} />
                                                <Text style={{ fontSize: 12 }}>{agent.name}</Text>
                                            </Space>
                                            {!vote ? (
                                                <Tag style={{ fontSize: 10 }}>Running</Tag>
                                            ) : (
                                                <Tag color={vote.vote === 'approve' ? 'success' : 'error'} style={{ fontSize: 10 }}>
                                                    {vote.vote}
                                                </Tag>
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card>

                    {/* Evidence Panel */}
                    <Card title="📋 Evidence" style={{ marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
                        {proposal.status === 'deliberating' && simulating ? (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <Spin tip="Retrieving evidence..." />
                            </div>
                        ) : (
                            evidence.map((e, i) => (
                                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text strong style={{ fontSize: 12 }}>{e.source}</Text>
                                        <Tag style={{ fontSize: 10 }}>{(e.relevance * 100).toFixed(0)}%</Tag>
                                    </div>
                                    <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                                        "{e.excerpt}"
                                    </Paragraph>
                                </div>
                            ))
                        )}
                    </Card>

                    {/* Final Voting Section */}
                    <Card title="🗳️ Final Voting Results" style={{ marginBottom: 16, border: '1px solid #1890ff' }}>
                        {!conclusionStatement ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                                <CarryOutOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                <p style={{ marginBottom: 4 }}>Voting Locked</p>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    Requires 5 rounds
                                </Text>
                            </div>
                        ) : (
                            <div>
                                <Alert
                                    message="Consensus Reached"
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                {agentVotes.map((v, i) => (
                                    <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Space>
                                            <Avatar size="small" style={{ backgroundColor: getAgentColor(v.domain || 'Finance') }}>
                                                {v.agent[0]}
                                            </Avatar>
                                            <Text style={{ fontSize: 12 }}>{v.agent}</Text>
                                        </Space>
                                        <Tag color={v.vote === 'approve' ? 'success' : v.vote === 'reject' ? 'error' : 'default'}>
                                            {v.vote.toUpperCase()}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Action Buttons - Fixed at bottom of column or just part of flow? Part of flow is fine. */}
                    <Card>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                block
                                icon={<CheckCircleOutlined />}
                                disabled={!conclusionStatement || proposal.status === 'deliberating'}
                                onClick={handleApprove}
                            >
                                Approve
                            </Button>
                            <Button
                                danger
                                block
                                icon={<CloseCircleOutlined />}
                                disabled={!conclusionStatement || proposal.status === 'deliberating'}
                                onClick={handleReject}
                            >
                                Reject
                            </Button>
                            <Button block onClick={handleRequestMoreInfo}>Request Info</Button>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Request More Information"
                open={isInfoModalVisible}
                onOk={submitInfoRequest}
                onCancel={() => setIsInfoModalVisible(false)}
                confirmLoading={requestLoading}
                okText="Send Request"
            >
                <Paragraph>
                    Specify what additional information you need from the agents.
                </Paragraph>
                <Input.TextArea
                    rows={4}
                    value={infoRequest}
                    onChange={(e) => setInfoRequest(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default ProposalDetail;
