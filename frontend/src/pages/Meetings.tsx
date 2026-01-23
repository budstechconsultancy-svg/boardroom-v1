import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, message, Spin, Typography, Row } from 'antd';
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
        vote_counts: { APPROVE: number; DISAPPROVE: number; ABSTAIN: number };
        overall_recommendation: string;
    };
}

const Meetings: React.FC = () => {
    const [sessions, setSessions] = useState<MeetingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const navigate = useNavigate();

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

    const handleTriggerMeeting = async () => {
        setTriggering(true);
        try {
            const response = await apiClient.post('/proposals/trigger-meeting');
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
        navigate(`/meetings/${session.id}`);
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

            {/* Proposal Detail moved to separate page */}
        </div>
    );
};

export default Meetings;
