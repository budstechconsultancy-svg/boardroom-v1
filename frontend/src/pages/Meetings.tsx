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
    recommendation: string;
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
            fetchSessions();
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
            render: (name: string) => <Text style={{ color: '#fff' }}>{name}</Text>
        },
        {
            title: 'Proposal',
            dataIndex: 'proposal_title',
            key: 'proposal',
            render: (title: string) => <Text style={{ color: '#fff' }}>{title}</Text>
        },
        {
            title: 'Recommendation',
            dataIndex: 'recommendation',
            key: 'recommendation',
            render: (rec: string) => {
                const colors: Record<string, string> = {
                    APPROVE: '#52c41a',
                    REJECT: '#ff4d4f',
                    REQUEST_INFO: '#faad14'
                };
                return <Tag color={colors[rec]}>{rec}</Tag>;
            }
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence_score',
            key: 'confidence',
            render: (score: number) => <Text style={{ color: '#8b5cf6' }}>{(score * 100).toFixed(0)}%</Text>
        },
        {
            title: 'Human Attention',
            dataIndex: 'requires_human_attention',
            key: 'attention',
            render: (required: boolean) => (
                <Tag color={required ? 'warning' : 'success'}>{required ? 'Yes' : 'No'}</Tag>
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
        </div>
    );
};

export default Meetings;
