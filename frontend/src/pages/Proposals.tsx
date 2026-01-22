import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, PrinterOutlined, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateProposalModal from '../components/CreateProposalModal';
import { useProposals } from '../contexts/ProposalContext';

const { Option } = Select;
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
            render: (id: string | number) => `P-${id.toString().padStart(3, '0')}`
        },
        { title: 'Title', dataIndex: 'title', key: 'title' },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: (d: string) => <Tag>{d}</Tag>,
        },
        {
            title: 'Risk',
            dataIndex: 'riskTier',
            key: 'riskTier',
            render: (r: string) => (
                <Tag color={r === 'high' ? 'red' : r === 'medium' ? 'orange' : 'green'}>
                    {(r || 'medium').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => <Tag color="processing">{(s || 'deliberating').replace('_', ' ').toUpperCase()}</Tag>,
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (c: number) => `${((c || 0) * 100).toFixed(0)}%`,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Button type="link" onClick={() => navigate(`/proposals/${record.id}`)}>
                    View
                </Button>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin indicator={antIcon} tip="Loading Proposals..." />
            </div>
        );
    }

    return (
        <div>
            <Card
                title="Proposals"
                extra={
                    <Space>
                        <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
                        <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>Export PDF</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                            New Proposal
                        </Button>
                    </Space>
                }
            >
                <Table
                    dataSource={proposals}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
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
