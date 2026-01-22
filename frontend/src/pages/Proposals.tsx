import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message, Spin, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, PrinterOutlined, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateProposalModal from '../components/CreateProposalModal';
import { useProposals } from '../contexts/ProposalContext';

const { Option } = Select;
const { Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Proposals: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { proposals, loading, addProposal } = useProposals();

    const handleCreateProposal = async (values: any) => {
        const domainMap: Record<string, string> = {
            finance: 'Finance',
            hr: 'HR',
            ops: 'Ops',
            sales: 'Sales',
            procurement: 'Procurement',
            legal: 'Legal',
            it_security: 'IT Security'
        };

        const newProposalData = {
            title: values.title.charAt(0).toUpperCase() + values.title.slice(1),
            domain: domainMap[values.domain] || values.domain,
            description: values.description,
            proposer: `${domainMap[values.domain] || values.domain} Agent`
        };

        try {
            await addProposal(newProposalData);
            setIsModalVisible(false);
            message.success('Proposal initiated successfully. All agents notified for deliberation.');
        } catch (error) {
            message.error('Failed to initiate proposal.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        message.info('Opening print dialog - select "Save as PDF" to export');
        window.print();
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (id: string | number) => <Text strong style={{ color: '#8b5cf6' }}>{`P-${id.toString().padStart(4, '0')}`}</Text>
        },
        { title: 'Title', dataIndex: 'title', key: 'title', render: (text: string) => <Text style={{ color: '#fff' }}>{text}</Text> },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: (d: string) => <Tag style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}>{d}</Tag>,
        },
        {
            title: 'Risk',
            dataIndex: 'riskTier',
            key: 'riskTier',
            render: (r: string) => (
                <Tag color={r === 'high' ? 'error' : r === 'medium' ? 'warning' : 'success'} style={{ background: 'transparent' }}>
                    {(r || 'medium').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={s === 'approved' ? 'success' : s === 'rejected' ? 'error' : '#8b5cf6'} style={{ background: 'transparent' }}>
                    {(s || 'deliberating').replace('_', ' ').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (c: number) => <Text style={{ color: '#fff' }}>{`${((c || 0) * 100).toFixed(0)}%`}</Text>,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => <Text type="secondary" style={{ fontSize: 13 }}>{d}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Button type="link" onClick={() => navigate(`/proposals/${record.id}`)} style={{ color: '#8b5cf6' }}>
                    Analyze Details
                </Button>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#8b5cf6' }} spin />} tip="Synchronizing Proposal Repository..." />
            </div>
        );
    }

    return (
        <div>
            <Card
                className="glass-card"
                title={<span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Proposals Repository</span>}
                extra={
                    <Space size={12}>
                        <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Print</Button>
                        <Button icon={<DownloadOutlined />} onClick={handleExportPDF} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Export PDF</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ height: 36 }}>
                            New Proposal
                        </Button>
                    </Space>
                }
                bodyStyle={{ padding: '0' }}
            >
                <Table
                    dataSource={[...proposals].sort((a, b) => Number(b.id) - Number(a.id))}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                    style={{ padding: '0 24px 24px 24px' }}
                />
            </Card>

            <CreateProposalModal
                visible={isModalVisible}
                onSubmit={handleCreateProposal}
                onCancel={() => setIsModalVisible(false)}
            />
        </div>
    );
};

export default Proposals;
