import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Tag, Progress, Button, Timeline, Avatar, Typography, Space, Alert, Spin, message, Modal, Input, Tooltip } from 'antd';
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
    MessageOutlined,
    SolutionOutlined
} from '@ant-design/icons';
import { useProposals } from '../contexts/ProposalContext';

const { Title, Text, Paragraph } = Typography;

const ProposalDetail: React.FC = () => {
    const { id } = useParams();
    const { proposals, loading, delibs_ready, updateProposalStatus, getDeliberation, addInfoRequest, refreshProposals } = useProposals();
    const [requestLoading, setRequestLoading] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [infoRequest, setInfoRequest] = useState('');

    const proposal = proposals.find(p => p.id === id);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const rounds = proposal ? getDeliberation(proposal.id) : [];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [rounds]);

    if (loading && !proposal) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin tip="Loading Details..." />
            </div>
        );
    }

    if (!proposal) {
        return <Alert message="Proposal Not Found" description="The requested proposal could not be retrieved." type="error" />;
    }

    const handleRequestMoreInfo = () => {
        setIsInfoModalVisible(true);
    };

    const submitInfoRequest = async () => {
        if (!infoRequest.trim()) {
            message.error('Please enter your question or request');
            return;
        }
        setRequestLoading(true);
        try {
            await addInfoRequest(proposal.id, infoRequest);
            setIsInfoModalVisible(false);
            setInfoRequest('');
            message.success('Request sent to Agents. Council is reviewing your query.');
        } catch (error) {
            message.error('Failed to send request.');
        } finally {
            setRequestLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await updateProposalStatus(proposal.id, 'approved');
            message.success('Proposal approved and executed successfully.');
        } catch (error) {
            message.error('Failed to approve proposal.');
        }
    };

    const handleReject = async () => {
        try {
            await updateProposalStatus(proposal.id, 'rejected');
            message.info('Proposal rejected.');
        } catch (error) {
            message.error('Failed to reject proposal.');
        }
    };

    const getAgentColor = (domain?: string) => {
        const colors: Record<string, string> = {
            'finance': '#1890ff',
            'hr': '#eb2f96',
            'ops': '#52c41a',
            'legal': '#faad14',
            'sales': '#722ed1',
            'procurement': '#fa541c',
            'security': '#13c2c2',
            'system': '#8c8c8c',
            'admin': '#52616b'
        };
        return colors[domain?.toLowerCase() || 'finance'] || '#1890ff';
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header Card */}
            <div style={{ flexShrink: 0, marginBottom: 16 }}>
                <Card bodyStyle={{ padding: '12px 24px' }}>
                    <Row gutter={[24, 16]} align="middle">
                        <Col span={16}>
                            <Space size="middle" align="baseline">
                                <Title level={4} style={{ marginBottom: 0 }}>{proposal.title}</Title>
                                <Tag color="blue">{proposal.domain}</Tag>
                                <Tag color={proposal.riskTier === 'high' ? 'red' : proposal.riskTier === 'medium' ? 'orange' : 'green'}>
                                    {(proposal.riskTier || 'medium').toUpperCase()} RISK
                                </Tag>
                                <Tag color="processing" icon={proposal.status === 'deliberating' ? <SyncOutlined spin /> : null}>
                                    {(proposal.status || 'deliberating').toUpperCase()}
                                </Tag>
                            </Space>
                            <Paragraph style={{ marginTop: 8, marginBottom: 0 }} ellipsis={{ rows: 2 }}>{proposal.description}</Paragraph>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Space>
                                <div style={{ textAlign: 'right', marginRight: 16 }}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Council Confidence</Text>
                                    <Text strong style={{ fontSize: 18, color: proposal.confidence >= 0.8 ? '#52c41a' : '#faad14' }}>
                                        {((proposal.confidence || 0) * 100).toFixed(0)}%
                                    </Text>
                                </div>
                                <Progress
                                    type="circle"
                                    percent={(proposal.confidence || 0) * 100}
                                    width={50}
                                    format={() => null}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>
            </div>

            {/* Main Content Area */}
            <Row gutter={16} style={{ flex: 1, overflow: 'hidden' }}>
                <Col span={16} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        title={<span><MessageOutlined /> Multi-Round Deliberation</span>}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px 24px 24px', overflow: 'hidden' }}
                        extra={<Button type="link" onClick={refreshProposals} icon={<SyncOutlined />}>Refresh</Button>}
                    >
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            <Timeline mode="left" style={{ marginTop: 24 }}>
                                {rounds.map((r, i) => (
                                    <Timeline.Item key={i} color="blue" label={<Text strong>Round {r.round}</Text>}>
                                        <div style={{ marginBottom: 24 }}>
                                            <Tag color="geekblue" style={{ marginBottom: 16 }}>{r.phase}</Tag>

                                            {r.conversations?.map((conv, idx) => (
                                                <div key={idx} style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
                                                    <Avatar
                                                        icon={conv.domain === 'admin' ? <UserOutlined /> : <RobotOutlined />}
                                                        style={{ backgroundColor: getAgentColor(conv.domain), marginRight: 12, minWidth: 32 }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                            <Text strong style={{ marginRight: 8, fontSize: 13 }}>{conv.agent}</Text>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>{conv.timestamp}</Text>
                                                            {conv.isChallenge && <Tag color="error" style={{ marginLeft: 8, fontSize: 10 }}>Conflict</Tag>}
                                                            {conv.message.includes('agree') && <Tag color="success" style={{ marginLeft: 8, fontSize: 10 }}>Agree</Tag>}
                                                            {conv.message.includes('abstain') && <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>Abstain</Tag>}
                                                        </div>
                                                        <div style={{
                                                            background: conv.isChallenge ? '#fff1f0' : '#f0f2f5',
                                                            padding: '12px 16px',
                                                            borderRadius: '0 12px 12px 12px',
                                                            border: '1px solid #e8e8e8',
                                                            display: 'inline-block',
                                                            maxWidth: '92%'
                                                        }}>
                                                            <Text style={{ fontSize: 14 }}>{conv.message}</Text>

                                                            {conv.evidence && (
                                                                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                                                                    <Space direction="vertical" size={0}>
                                                                        <Text strong style={{ fontSize: 11, color: '#1890ff' }}>
                                                                            <SolutionOutlined /> EVIDENCE ATTACHED
                                                                        </Text>
                                                                        <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                                                                            "{conv.evidence}"
                                                                        </Text>
                                                                    </Space>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {r.conclusion && (
                                                <Alert
                                                    message={`Round ${r.round} Summary`}
                                                    description={r.conclusion}
                                                    type="info"
                                                    showIcon
                                                    style={{ marginTop: 16, borderRadius: 8 }}
                                                />
                                            )}
                                        </div>
                                    </Timeline.Item>
                                ))}
                                <div ref={chatEndRef} />
                            </Timeline>
                        </div>
                    </Card>
                </Col>

                <Col span={8} style={{ height: '100%', overflowY: 'auto' }}>
                    <Card title="🗳️ Council Actions">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                block
                                icon={<CheckCircleOutlined />}
                                onClick={handleApprove}
                                disabled={rounds.length < 5}
                            >
                                Unified Approval
                            </Button>
                            <Button
                                danger
                                block
                                icon={<CloseCircleOutlined />}
                                onClick={handleReject}
                                disabled={rounds.length < 3}
                            >
                                Reject Proposal
                            </Button>
                            <Button block icon={<QuestionCircleOutlined />} onClick={handleRequestMoreInfo}>
                                Query Council
                            </Button>
                        </Space>
                        {rounds.length < 5 && (
                            <div style={{ marginTop: 12 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <SyncOutlined spin style={{ marginRight: 8 }} />
                                    Awaiting full 5-round deliberation...
                                </Text>
                            </div>
                        )}
                    </Card>

                    <Card title="📊 Proposed Impact" style={{ marginTop: 16 }}>
                        <Paragraph type="secondary">
                            {proposal.impactSummary || "Retrieving automated impact projections from active agents..."}
                        </Paragraph>
                        {rounds.length >= 3 && (
                            <Alert
                                message="Strategic Alignment"
                                description="High alignment with Q1-Q2 organizational objectives."
                                type="success"
                                icon={<CheckCircleOutlined />}
                                showIcon
                                style={{ marginTop: 8 }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Direct Inquiry to Council"
                open={isInfoModalVisible}
                onOk={submitInfoRequest}
                onCancel={() => setIsInfoModalVisible(false)}
                confirmLoading={requestLoading}
                okText="Submit Query"
            >
                <Paragraph>
                    What additional context or documentation do you require from the agents?
                </Paragraph>
                <Input.TextArea
                    rows={4}
                    value={infoRequest}
                    placeholder="e.g. Can you provide a breakdown of the implementation timeline?"
                    onChange={(e) => setInfoRequest(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default ProposalDetail;
