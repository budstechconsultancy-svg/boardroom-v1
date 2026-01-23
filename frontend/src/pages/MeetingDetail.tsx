import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, message, Spin, Typography, Row, Col, Timeline, Empty } from 'antd';
import { LoadingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface MeetingSession {
    id: string;
    session_date: string;
    proposal_title: string;
    status: string;
    total_rounds: number;
    summary: {
        vote_counts: { APPROVE: number; DISAPPROVE: number; ABSTAIN: number };
        overall_recommendation: string;
    };
    rounds?: DiscussionRound[];
    opinions?: AgentOpinion[];
}

interface DiscussionRound {
    id: number;
    round_number: number;
    agent_name: string;
    agent_domain: string;
    statement: string;
    evidence: Array<{ type: string; description: string; reference: string }>;
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

const MeetingDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState<MeetingSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchSessionDetails(id);
        }
    }, [id]);

    const fetchSessionDetails = async (sessionId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/meetings/sessions/${sessionId}/`);
            setSession(response.data);
        } catch (error) {
            console.error('Error fetching session details:', error);
            message.error('Failed to load discussion details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#8b5cf6' }} spin />} />
                <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.65)' }}>Loading Meeting Details...</div>
            </div>
        );
    }

    if (!session) {
        return <div style={{ color: '#fff', textAlign: 'center', padding: 50 }}>Session not found</div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/meetings')}
                    style={{ color: '#fff', marginRight: 16 }}
                >
                    Back to Meetings
                </Button>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>Discussion: {session.proposal_title}</Title>
            </div>

            <Card className="glass-card">
                {session.rounds && session.rounds.length > 0 ? (
                    <>
                        {/* Discussion Timeline */}
                        <div style={{ marginBottom: 24 }}>
                            <Title level={5} style={{ color: '#8b5cf6', marginBottom: 16 }}>Discussion Rounds ({session.rounds.length})</Title>
                            <Timeline
                                items={session.rounds.map((round) => ({
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
                                            {session.summary?.vote_counts?.APPROVE || 0}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>DISAPPROVE</div>
                                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                                            {session.summary?.vote_counts?.DISAPPROVE || 0}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', marginBottom: 8 }}>ABSTAIN</div>
                                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                                            {session.summary?.vote_counts?.ABSTAIN || 0}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <div style={{ marginTop: 16, textAlign: 'center', padding: 12, backgroundColor: 'rgba(139, 92, 246, 0.15)', borderRadius: 6 }}>
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                    Overall: <span style={{ color: '#8b5cf6' }}>{session.summary?.overall_recommendation}</span>
                                </Text>
                            </div>
                        </div>

                        {/* Individual Votes */}
                        {session.opinions && session.opinions.length > 0 && (
                            <Card style={{ marginTop: 16, backgroundColor: 'rgba(31, 24, 55, 0.4)' }}>
                                <Title level={5} style={{ color: '#8b5cf6', marginBottom: 12 }}>Individual Agent Votes</Title>
                                <Row gutter={[8, 8]}>
                                    {session.opinions.map((opinion) => (
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
        </div>
    );
};

export default MeetingDetail;
