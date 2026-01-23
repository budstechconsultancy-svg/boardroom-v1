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
            message.success('Request sent to Council. Discussion initiated.');
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
        <div style={{ padding: 0, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Card */}
            <div style={{ flexShrink: 0, marginBottom: 16 }}>
                <Card className="glass-card" styles={{ body: { padding: '20px 24px' } }}>
                    <Row gutter={[24, 16]} align="middle">
                        <Col span={16}>
                            <Space size="middle" align="baseline">
                                <Title level={4} style={{ marginBottom: 0, color: '#fff' }}>{proposal.title}</Title>
                                <Tag style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf633', color: '#8b5cf6' }}>{proposal.domain}</Tag>
                                <Tag color={proposal.riskTier === 'high' ? 'error' : proposal.riskTier === 'medium' ? 'warning' : 'success'} style={{ background: 'transparent' }}>
                                    {(proposal.riskTier || 'medium').toUpperCase()} RISK
                                </Tag>
                                <Tag color="#8b5cf6" style={{ background: 'transparent' }} icon={proposal.status === 'deliberating' ? <SyncOutlined spin /> : null}>
                                    {(proposal.status || 'deliberating').toUpperCase()}
                                </Tag>
                            </Space>
                            <Paragraph style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255, 255, 255, 0.45)' }} ellipsis={{ rows: 2 }}>{proposal.description}</Paragraph>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Space size={20}>
                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Council Confidence</Text>
                                    <Text strong style={{ fontSize: 24, color: '#fff' }}>
                                        {((proposal.confidence || 0) * 100).toFixed(0)}%
                                    </Text>
                                </div>
                                <Progress
                                    type="circle"
                                    percent={(proposal.confidence || 0) * 100}
                                    size={45}
                                    strokeColor="#8b5cf6"
                                    trailColor="rgba(255, 255, 255, 0.05)"
                                    format={() => null}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>
            </div>

            {/* Main Content Area */}
            <Row gutter={24} style={{ flex: 1, overflow: 'hidden' }}>
                <Col span={16} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card
                        className="glass-card"
                        title={<span style={{ color: '#fff' }}><MessageOutlined style={{ marginRight: 8 }} /> Multi-Round Deliberation</span>}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        styles={{ body: { flex: 1, padding: '24px', overflowY: 'auto' } }}
                        extra={<Button type="link" onClick={refreshProposals} icon={<SyncOutlined />} style={{ color: '#8b5cf6' }}>Refresh</Button>}
                    >
                        <Timeline
                            mode="left"
                            items={rounds.map((r, i) => ({
                                color: "#8b5cf6",
                                label: <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12 }}>RD {r.round}</Text>,
                                children: (
                                    <div style={{ marginBottom: 24 }}>
                                        <Tag style={{ background: 'rgba(139, 92, 246, 0.15)', border: 'none', color: '#fff', marginBottom: 16 }}>{r.phase}</Tag>

                                        {r.conversations?.map((conv, idx) => (
                                            <div key={idx} style={{ display: 'flex', marginBottom: 16, alignItems: 'flex-start' }}>
                                                <Avatar
                                                    icon={conv.domain === 'admin' ? <UserOutlined /> : <RobotOutlined />}
                                                    style={{ backgroundColor: getAgentColor(conv.domain), marginRight: 12, minWidth: 32, boxShadow: `0 0 10px ${getAgentColor(conv.domain)}44` }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text strong style={{ marginRight: 8, fontSize: 13, color: '#fff' }}>{conv.agent}</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>{conv.timestamp}</Text>
                                                        {conv.isChallenge && <Tag color="error" style={{ marginLeft: 8, fontSize: 10, background: 'transparent' }}>Conflict</Tag>}
                                                    </div>
                                                    <div style={{
                                                        background: conv.isChallenge ? 'rgba(255, 77, 79, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                                        padding: '12px 16px',
                                                        borderRadius: '0 12px 12px 12px',
                                                        border: `1px solid ${conv.isChallenge ? 'rgba(255, 77, 79, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                                                        display: 'inline-block',
                                                        maxWidth: '92%'
                                                    }}>
                                                        <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>{conv.message}</Text>
                                                        {conv.evidence && (
                                                            <div style={{
                                                                marginTop: 12,
                                                                padding: '10px 14px',
                                                                background: 'rgba(0, 0, 0, 0.2)',
                                                                borderRadius: 8,
                                                                borderLeft: `3px solid ${getAgentColor(conv.domain)}`,
                                                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                                                            }}>
                                                                <Space direction="vertical" size={2}>
                                                                    <Text strong style={{ fontSize: 10, color: getAgentColor(conv.domain), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                        <SolutionOutlined style={{ marginRight: 4 }} />
                                                                        Evidence: {conv.source || 'Council Source'}
                                                                    </Text>
                                                                    <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: '1.4', color: 'rgba(255, 255, 255, 0.45)' }}>
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
                                            <div style={{
                                                marginTop: 12,
                                                padding: '12px 16px',
                                                background: 'rgba(139, 92, 246, 0.05)',
                                                borderRadius: 12,
                                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12
                                            }}>
                                                <SyncOutlined style={{ color: '#8b5cf6' }} />
                                                <div>
                                                    <Text strong style={{ display: 'block', fontSize: 12, color: '#8b5cf6', textTransform: 'uppercase' }}>Round {r.round} Result</Text>
                                                    <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)' }}>{r.conclusion}</Text>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            }))}
                        />
                        <div ref={chatEndRef} />
                    </Card>
                </Col>

                <Col span={8} style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card title={<span style={{ color: '#fff' }}>🗳️ Council Actions</span>} className="glass-card">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            <Button
                                type="primary"
                                block
                                icon={<CheckCircleOutlined />}
                                onClick={handleApprove}
                                disabled={rounds.length < 5}
                                style={{ height: 40 }}
                            >
                                Unified Approval
                            </Button>
                            <Button
                                danger
                                block
                                icon={<CloseCircleOutlined />}
                                onClick={handleReject}
                                disabled={rounds.length < 3}
                                style={{ height: 40, background: 'rgba(255, 77, 79, 0.05)', border: '1px solid rgba(255, 77, 79, 0.2)' }}
                            >
                                Reject Proposal
                            </Button>
                            <Button
                                block
                                icon={<QuestionCircleOutlined />}
                                onClick={handleRequestMoreInfo}
                                style={{ height: 40, background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            >
                                Query Council
                            </Button>
                        </Space>
                        {rounds.length < 5 && (
                            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Text type="secondary" style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)' }}>
                                    <SyncOutlined spin style={{ marginRight: 8, color: '#8b5cf6' }} />
                                    Awaiting full 5-round deliberation...
                                </Text>
                            </div>
                        )}
                    </Card>

                    <Card title={<span style={{ color: '#fff' }}>📊 Strategic Impact</span>} className="glass-card">
                        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 13, lineHeight: '1.6' }}>
                            {proposal.impactSummary || "Retrieving automated impact projections from active agents based on cross-domain data points..."}
                        </Paragraph>
                        {rounds.length >= 3 && (
                            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(82, 196, 26, 0.05)', borderRadius: 8, border: '1px solid rgba(82, 196, 26, 0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13 }}>High Strategic Alignment</Text>
                            </div>
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
