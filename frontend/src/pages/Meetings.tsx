import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Spin, Typography, Row, Col, Statistic, Timeline, Empty } from 'antd';
import { LoadingOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface MeetingSession {
    id: number;
    session_date: string;
    proposal_title: string;
    status: string;
    total_rounds: number;
    summary: {
        vote_counts: {APPROVE: number; DISAPPROVE: number; ABSTAIN: number};
        overall_recommendation: string;
    };
}

interface DiscussionRound {
    id: number;
    round_number: number;
    agent_name: string;
    agent_domain: string;
    statement: string;
    evidence: Array<{type: string; description: string; reference: string}>;
    suggestions: string[];
    created_at: string;
}

interface AgentOpinion {
    id: number;
    agent_name: string;
    vote: string;
    confidence_score: number;
    requires_human_attention: boolean;
}

const Meetings: React.FC = () => {
    const [sessions, setSessions] = useState<MeetingSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(null);
    const [rounds, setRounds] = useState<DiscussionRound[]>([]);
    const [opinions, setOpinions] = useState<AgentOpinion[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
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

    const fetchSessionDetails = async (sessionId: number) => {
        setLoadingDetails(true);
        try {
            const response = await apiClient.get(`/meetings/sessions/${sessionId}/`);
            const session = response.data;
            setRounds(session.rounds || []);
            setOpinions(session.opinions || []);
            if (!session.rounds || session.rounds.length === 0) {
                message.info('This session has no discussion rounds (old format)');
            }
        } catch (error) {
            console.error('Error fetching session details:', error);
            message.error('Failed to load discussion details');
        } finally {
            setLoadingDetails(false);
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
        fetchSessionDetails(session.id);
    };

    const sessionColumns = [
        {
            title: 'Proposal',
            dataIndex: 'proposal_title',
            key: 'proposal',
            render: (title: string) => <Text style={{ color: '#fff' }}>{title}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'session_date',
            key: 'date',
            render: (date: string) => <Text style={{ color: '#fff' }}>{new Date(date).toLocaleString()}</Text>
        },
        {
            title: 'Rounds',
            dataIndex: 'total_rounds',
            key: 'rounds',
            render: (rounds: number) => <Text style={{ color: '#8b5cf6' }}>{rounds}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: Record<string, string> = {
                    completed: '#52c41a',
                    in_progress: '#faad14',
                    failed: '#ff4d4f'
                };
                return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Recommendation',
            dataIndex: ['summary', 'overall_recommendation'],
            key: 'recommendation',
            render: (rec: string) => {
                const colors: Record<string, string> = {
                    APPROVE: '#52c41a',
                    DISAPPROVE: '#ff4d4f',
                    SPLIT: '#faad14'
                };
                return <Tag color={colors[rec]}>{rec}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: MeetingSession) => (
                <Button type="link" onClick={() => handleSessionClick(record)} style={{ color: '#8b5cf6' }}>
                    View Discussion
                </Button>
            )
        }
    ];

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
            {/* Header */}
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
                        style={{ height: 40, background: '#8b5cf6', borderColor: '#8b5cf6' }}
                    >
                        Trigger Meeting
                    </Button>
                </div>
            </Row>

            {/* Meeting History */}
            <Card className="glass-card" styles={{ body: { padding: 0 } }}>
                <Table
                    dataSource={sessions}
                    columns={sessionColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                    style={{ padding: '0 24px 24px 24px' }}
                />
            </Card>

            {/* Detailed Discussion View */}
            {selectedSession && (
                <Card
                    className="glass-card"
                    title={<span style={{ color: '#fff' }}>📋 Discussion: {selectedSession.proposal_title}</span>}
                    style={{ marginTop: 24 }}
                    extra={<Button type="text" onClick={() => setSelectedSession(null)} style={{ color: '#fff' }}>Close</Button>}
                >
                    {loadingDetails ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin indicator={antIcon} />
                            <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading discussion details...</div>
                        </div>
                    ) : rounds.length > 0 ? (
                        <>
                    {/* Discussion Timeline */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={5} style={{ color: '#8b5cf6', marginBottom: 16 }}>Discussion Rounds ({rounds.length})</Title>
                        <Timeline
                            items={rounds.map((round, index) => ({
                                dot: <div style={{ backgroundColor: '#8b5cf6', width: 12, height: 12, borderRadius: '50%' }} />,
                                children: (
                                    <Card
                                        style={{
                                            backgroundColor: 'rgba(139, 92, 246, 0.08)',
                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                            marginBottom: 12
                                        }}
                                    >
                                        <div style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: 8 }}>
                                            Round {round.round_number} - {round.agent_name}
                                        </div>
                                        <Text style={{ color: '#fff', display: 'block', marginBottom: 12, lineHeight: 1.6 }}>
                                            {round.statement}
                                        </Text>
                                        
                                        {/* Evidence */}
                                        {round.evidence && round.evidence.length > 0 && (
                                            <div style={{ marginBottom: 12 }}>
                                                <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, fontWeight: 'bold' }}>
                                                    📊 EVIDENCE:
                                                </Text>
                                                {round.evidence.map((e, i) => (
                                                    <div key={i} style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, marginTop: 4, marginLeft: 16 }}>
                                                        <span style={{ color: '#8b5cf6' }}>•</span> {e.description} ({e.reference})
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {round.suggestions && round.suggestions.length > 0 && (
                                            <div>
                                                <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, fontWeight: 'bold' }}>
                                                    💡 SUGGESTIONS:
                                                </Text>
                                                {round.suggestions.map((s, i) => (
                                                    <div key={i} style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, marginTop: 4, marginLeft: 16 }}>
                                                        <span style={{ color: '#8b5cf6' }}>•</span> {s}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                )
                            }))}
                        />
                    </div>

                    {/* Vote Summary */}
                    <div style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 8 }}>
                        <Title level={5} style={{ color: '#8b5cf6', marginBottom: 16 }}>🗳️ Final Voting Results</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={8}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>APPROVE</div>
                                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                                        {selectedSession.summary?.vote_counts?.APPROVE || 0}
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={8}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>DISAPPROVE</div>
                                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                                        {selectedSession.summary?.vote_counts?.DISAPPROVE || 0}
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={8}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>ABSTAIN</div>
                                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                                        {selectedSession.summary?.vote_counts?.ABSTAIN || 0}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        <div style={{ marginTop: 16, textAlign: 'center', padding: 12, backgroundColor: 'rgba(139, 92, 246, 0.15)', borderRadius: 6 }}>
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                Overall: <span style={{ color: '#8b5cf6' }}>{selectedSession.summary?.overall_recommendation}</span>
                            </Text>
                        </div>
                    </div>

                    {/* Individual Votes */}
                    {opinions.length > 0 && (
                        <Card style={{ marginTop: 16, backgroundColor: 'rgba(31, 24, 55, 0.4)' }}>
                            <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>Individual Agent Votes</Title>
                            <Row gutter={[8, 8]}>
                                {opinions.map((opinion) => (
                                    <Col key={opinion.id} xs={24} sm={12} lg={8}>
                                        <div style={{
                                            padding: 12,
                                            backgroundColor: 'rgba(139, 92, 246, 0.08)',
                                            borderRadius: 6,
                                            borderLeft: `3px solid ${opinion.vote === 'APPROVE' ? '#52c41a' : opinion.vote === 'DISAPPROVE' ? '#ff4d4f' : '#faad14'}`
                                        }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
                                                {opinion.agent_name}
                                            </Text>
                                            <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, display: 'block', marginBottom: 4 }}>
                                                Vote: <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{opinion.vote}</span>
                                            </Text>
                                            <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12 }}>
                                                Confidence: {(opinion.confidence_score * 100).toFixed(0)}%
                                            </Text>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    )}
                        </>
                    ) : (
                        <Empty
                            description={<Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>No discussion rounds available (old format session)</Text>}
                        />
                    )}
                </Card>
            )}
        </div>
    );
};

export default Meetings;
