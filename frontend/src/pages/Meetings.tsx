import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Spin, Typography, Row, Col, Statistic, Tabs } from 'antd';
import { LoadingOutlined, ReloadOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface MeetingSession {
    id: number;
    session_date: string;
    status: string;
    proposals_reviewed: number[];
    summary: {
        total_proposals: number;
        total_opinions: number;
        attention_required: number;
        agents_participated: number;
    };
    opinions_count: number;
    attention_required_count: number;
}

interface AgentOpinion {
    id: number;
    agent_name: string;
    agent_domain: string;
    proposal_title: string;
    analysis: string;
    suggestions: string[];
    improvements: Record<string, string[]>;
    evidence: Array<{type: string; description: string; reference: string}>;
    vote: string;
    confidence_score: number;
    requires_human_attention: boolean;
    created_at: string;
}

const Meetings: React.FC = () => {
    const [sessions, setSessions] = useState<MeetingSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(null);
    const [opinions, setOpinions] = useState<AgentOpinion[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/meetings/sessions/');
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            message.error('Failed to load meeting sessions');
        } finally {
            setLoading(false);
        }
    };

    const fetchOpinions = async (sessionId: number) => {
        try {
            const response = await apiClient.get(`/meetings/opinions/?session_id=${sessionId}`);
            setOpinions(response.data);
        } catch (error) {
            console.error('Error fetching opinions:', error);
            message.error('Failed to load opinions');
        }
    };

    const handleTriggerMeeting = async () => {
        setTriggering(true);
        try {
            const response = await apiClient.post('/meetings/meetings/trigger/');
            message.success('Board meeting completed successfully!');
            await fetchSessions();
        } catch (error: any) {
            console.error('Error triggering meeting:', error);
            message.error(error.response?.data?.error || 'Failed to trigger meeting');
        } finally {
            setTriggering(false);
        }
    };

    const handleSessionClick = (session: MeetingSession) => {
        setSelectedSession(session);
        fetchOpinions(session.id);
    };

    const sessionColumns = [
        {
            title: 'Date',
            dataIndex: 'session_date',
            key: 'session_date',
            render: (date: string) => <Text style={{ color: '#fff' }}>{new Date(date).toLocaleString()}</Text>
        },
        {
            title: 'Proposals',
            dataIndex: 'summary',
            key: 'proposals',
            render: (summary: any) => <Text style={{ color: '#8b5cf6' }}>{summary?.total_proposals || 0}</Text>
        },
        {
            title: 'Opinions',
            dataIndex: 'summary',
            key: 'opinions',
            render: (summary: any) => <Text style={{ color: '#fff' }}>{summary?.total_opinions || 0}</Text>
        },
        {
            title: 'Attention Required',
            dataIndex: 'summary',
            key: 'attention',
            render: (summary: any) => {
                const count = summary?.attention_required || 0;
                return <Tag color={count > 0 ? 'warning' : 'success'}>{count}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: Record<string, { color: string; icon: React.ReactNode }> = {
                    completed: { color: '#52c41a', icon: <CheckCircleOutlined /> },
                    in_progress: { color: '#faad14', icon: <ClockCircleOutlined /> },
                    failed: { color: '#ff4d4f', icon: <CheckCircleOutlined /> }
                };
                return <Tag icon={config[status]?.icon} color={config[status]?.color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: MeetingSession) => (
                <Button type="link" onClick={() => handleSessionClick(record)} style={{ color: '#8b5cf6' }}>
                    View Details
                </Button>
            )
        }
    ];

    const opinionColumns = [
        {
            title: 'Agent',
            dataIndex: 'agent_name',
            key: 'agent',
            width: 150,
            render: (name: string) => <Text style={{ color: '#fff' }}>{name}</Text>
        },
        {
            title: 'Vote',
            dataIndex: 'vote',
            key: 'vote',
            width: 120,
            render: (vote: string) => {
                const colors: Record<string, string> = {
                    APPROVE: '#52c41a',
                    DISAPPROVE: '#ff4d4f',
                    ABSTAIN: '#faad14'
                };
                return <Tag color={colors[vote]}>{vote}</Tag>;
            }
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence_score',
            key: 'confidence',
            width: 100,
            render: (score: number) => <Text style={{ color: '#8b5cf6' }}>{(score * 100).toFixed(0)}%</Text>
        },
        {
            title: 'Analysis',
            dataIndex: 'analysis',
            key: 'analysis',
            width: 250,
            render: (analysis: string) => <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{analysis?.substring(0, 80)}...</Text>
        },
        {
            title: 'Suggestions',
            dataIndex: 'suggestions',
            key: 'suggestions',
            width: 150,
            render: (suggestions: string[]) => (
                <Text style={{ color: '#8b5cf6' }}>{suggestions?.length || 0} suggestions</Text>
            )
        },
        {
            title: 'Attention',
            dataIndex: 'requires_human_attention',
            key: 'attention',
            width: 100,
            render: (required: boolean) => (
                <Tag color={required ? 'warning' : 'success'}>{required ? 'Yes' : 'No'}</Tag>
            )
        },
        {
            title: 'Details',
            key: 'details',
            width: 100,
            render: (_: any, record: AgentOpinion) => (
                <Button type="link" size="small" style={{ color: '#8b5cf6' }} onClick={() => showOpinionDetails(record)}>
                    View Full Discussion
                </Button>
            )
        }
    ];
    
    const [detailsModal, setDetailsModal] = React.useState(false);
    const [selectedOpinion, setSelectedOpinion] = React.useState<AgentOpinion | null>(null);
    
    const showOpinionDetails = (opinion: AgentOpinion) => {
        setSelectedOpinion(opinion);
        setDetailsModal(true);
    };

    if (loading && sessions.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading Meetings...</div>
            </div>
        );
    }

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>Board Meetings</Title>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchSessions}
                        style={{ height: 40, background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={handleTriggerMeeting}
                        loading={triggering}
                        style={{ height: 40 }}
                    >
                        Trigger Meeting
                    </Button>
                </div>
            </Row>

            {sessions.length > 0 && (
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <Statistic
                                title={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Total Sessions</span>}
                                value={sessions.length}
                                valueStyle={{ color: '#8b5cf6' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <Statistic
                                title={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Last Meeting</span>}
                                value={sessions[0] ? new Date(sessions[0].session_date).toLocaleDateString() : 'N/A'}
                                valueStyle={{ color: '#fff', fontSize: 20 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <Statistic
                                title={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Attention Required</span>}
                                value={sessions[0]?.summary?.attention_required || 0}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card
                className="glass-card"
                title={<span style={{ color: '#fff' }}>Meeting History</span>}
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    dataSource={sessions}
                    columns={sessionColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                    style={{ padding: '0 24px 24px 24px' }}
                />
            </Card>

            {selectedSession && (
                <Card
                    className="glass-card"
                    title={<span style={{ color: '#fff' }}>Agent Opinions - {new Date(selectedSession.session_date).toLocaleString()}</span>}
                    style={{ marginTop: 24 }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        dataSource={opinions}
                        columns={opinionColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                        style={{ padding: '0 24px 24px 24px' }}
                    />
                </Card>
            )}
            
            {selectedOpinion && (
                <Card
                    style={{
                        marginTop: 24,
                        backgroundColor: 'rgba(31, 24, 55, 0.6)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 12
                    }}
                    title={
                        <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Detailed Discussion - {selectedOpinion.agent_name} on {selectedOpinion.proposal_title}</span>
                            <Button type="text" onClick={() => { setSelectedOpinion(null); setDetailsModal(false); }} style={{ color: '#fff' }}>Close</Button>
                        </div>
                    }
                >
                    <div style={{ color: '#fff', lineHeight: 1.8 }}>
                        {/* Vote Summary */}
                        <div style={{ marginBottom: 24, padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 8 }}>
                            <Row gutter={24}>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>VOTE</div>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 'bold',
                                            color: selectedOpinion.vote === 'APPROVE' ? '#52c41a' : selectedOpinion.vote === 'DISAPPROVE' ? '#ff4d4f' : '#faad14',
                                            marginTop: 8
                                        }}>
                                            {selectedOpinion.vote}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>CONFIDENCE</div>
                                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#8b5cf6', marginTop: 8 }}>
                                            {(selectedOpinion.confidence_score * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>ATTENTION</div>
                                        <div style={{ fontSize: 16, marginTop: 8 }}>
                                            {selectedOpinion.requires_human_attention ? (
                                                <Tag color="warning">Required</Tag>
                                            ) : (
                                                <Tag color="success">Routine</Tag>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Analysis */}
                        <div style={{ marginBottom: 24 }}>
                            <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>📋 Analysis</Title>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{selectedOpinion.analysis}</Text>
                        </div>

                        {/* Suggestions */}
                        {selectedOpinion.suggestions && selectedOpinion.suggestions.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>💡 Suggestions</Title>
                                <ul style={{ color: 'rgba(255, 255, 255, 0.85)', paddingLeft: 20 }}>
                                    {selectedOpinion.suggestions.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvements */}
                        {selectedOpinion.improvements && Object.keys(selectedOpinion.improvements).length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>🔧 Proposed Improvements</Title>
                                {Object.entries(selectedOpinion.improvements).map(([category, items]: [string, any]) => (
                                    <div key={category} style={{ marginBottom: 12 }}>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, textTransform: 'uppercase' }}>{category.replace(/_/g, ' ')}</div>
                                        <ul style={{ color: 'rgba(255, 255, 255, 0.85)', paddingLeft: 20, marginTop: 4 }}>
                                            {items.map((item: string, i: number) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Evidence */}
                        {selectedOpinion.evidence && selectedOpinion.evidence.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>📊 Supporting Evidence</Title>
                                {selectedOpinion.evidence.map((e: any, i: number) => (
                                    <div key={i} style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(139, 92, 246, 0.08)', borderRadius: 6 }}>
                                        <div style={{ color: '#8b5cf6', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{e.type}</div>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 4 }}>{e.description}</div>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12 }}>Ref: {e.reference}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Meetings;
