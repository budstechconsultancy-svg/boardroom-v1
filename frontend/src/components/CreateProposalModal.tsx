import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';

interface CreateProposalModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
    visible,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            onSubmit(values);
            form.resetFields();
            setLoading(false);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title="Create New Proposal"
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="Submit Proposal"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ domain: 'finance', riskTier: 'medium' }}
            >
                <Form.Item
                    name="title"
                    label="Proposal Title"
                    rules={[{ required: true, message: 'Please enter a title' }]}
                >
                    <Input placeholder="E.g., Q1 Marketing Budget Increase" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter a description' }]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Describe the proposal, context, and desired outcome..."
                    />
                </Form.Item>

                <Form.Item
                    name="domain"
                    label="Domain"
                    rules={[{ required: true, message: 'Please select a domain' }]}
                >
                    <Select>
                        <Select.Option value="finance">Finance (CFO)</Select.Option>
                        <Select.Option value="hr">HR (CHRO)</Select.Option>
                        <Select.Option value="ops">Operations (COO)</Select.Option>
                        <Select.Option value="sales">Sales (CRO)</Select.Option>
                        <Select.Option value="procurement">Procurement (CPO)</Select.Option>
                        <Select.Option value="legal">Legal (CLO)</Select.Option>
                        <Select.Option value="it_security">IT Security (CISO)</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="target_agent"
                    label="Proposing Agent"
                    help="The agent that will champion this proposal initially"
                >
                    <Select disabled defaultValue="auto">
                        <Select.Option value="auto">Auto-assigned based on Domain</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProposalModal;
