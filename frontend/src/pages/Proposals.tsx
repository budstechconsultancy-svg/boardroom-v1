import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CreateProposalModal from '../components/CreateProposalModal';

const Proposals: React.FC = () => {
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Mock data state
    // Mock data state
    const [proposals, setProposals] = useState([
        { id: 'P-001', title: 'Q1 Budget Reallocation', domain: 'Finance', description: 'Proposal to reallocate $50,000 from unused training budget to marketing initiatives for Q1 campaign.', status: 'approved', riskTier: 'medium', confidence: 0.92, createdAt: '2024-01-15' },
        { id: 'P-002', title: 'New Hire: Senior Developer', domain: 'HR', description: 'Request for headcount increase to hire a Senior Full-stack Developer to accelerate product roadmap execution.', status: 'voting', riskTier: 'low', confidence: 0.85, createdAt: '2024-01-16' },
        { id: 'P-003', title: 'Inventory Optimization', domain: 'Ops', description: 'Implementation of AI-driven inventory management system to reduce holding costs by 12%.', status: 'deliberating', riskTier: 'medium', confidence: 0.78, createdAt: '2024-01-17' },
        { id: 'P-004', title: 'Major Vendor Contract', domain: 'Procurement', description: 'Renewal of cloud infrastructure contract with a 3-year commitment for a 15% discount.', status: 'pending_ceo', riskTier: 'high', confidence: 0.65, createdAt: '2024-01-18' },
    ]);

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

        const newProposal = {
            id: `P-00${proposals.length + 1}`,
            title: values.title.charAt(0).toUpperCase() + values.title.slice(1),
            domain: domainMap[values.domain] || values.domain,
            description: values.description,
            status: 'deliberating',
            riskTier: 'medium', // Default for now
            confidence: 0.6, // Initial confidence
            createdAt: new Date().toISOString().split('T')[0],
        };

        setProposals([newProposal, ...proposals]);
        setIsModalVisible(false);
        message.success('Proposal initiated successfully');
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
            render: (s: string) => <Tag color="processing">{s.replace('_', ' ')}</Tag>,
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
                <Button type="link" onClick={() => navigate(`/proposals/${record.id}`, { state: { proposal: record } })}>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        New Proposal
                    </Button>
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
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleCreateProposal}
            />
        </div>
    );
};

export default Proposals;
