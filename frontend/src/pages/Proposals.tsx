import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateProposalModal from '../components/CreateProposalModal';
import { useProposals } from '../contexts/ProposalContext';

const Proposals: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { proposals, addProposal } = useProposals(); // Use global context

    const handleCreateProposal = (values: any) => {
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
            proposer: `${domainMap[values.domain] || values.domain} Agent` // Assign a proposer
        };

        addProposal(newProposalData); // Add to global context
        setIsModalVisible(false);
        message.success('Proposal initiated successfully. All agents notified for deliberation.');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        message.info('Opening print dialog - select "Save as PDF" to export');
        window.print();
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
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
                    {r.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => <Tag color="processing">{s.replace('_', ' ').toUpperCase()}</Tag>, // Capitalize status
        },
        {
            title: 'Confidence',
            dataIndex: 'confidence',
            key: 'confidence',
            render: (c: number) => `${(c * 100).toFixed(0)}%`,
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
                <Space style={{ marginBottom: 16 }}>
                    <Input prefix={<SearchOutlined />} placeholder="Search proposals..." style={{ width: 250 }} />
                    <Select placeholder="Domain" style={{ width: 120 }} allowClear>
                        <Select.Option value="hr">HR</Select.Option>
                        <Select.Option value="finance">Finance</Select.Option>
                        <Select.Option value="ops">Operations</Select.Option>
                    </Select>
                    <Select placeholder="Status" style={{ width: 120 }} allowClear>
                        <Select.Option value="deliberating">Deliberating</Select.Option>
                        <Select.Option value="voting">Voting</Select.Option>
                        <Select.Option value="approved">Approved</Select.Option>
                    </Select>
                </Space>
                <Table dataSource={proposals} columns={columns} rowKey="id" />
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
