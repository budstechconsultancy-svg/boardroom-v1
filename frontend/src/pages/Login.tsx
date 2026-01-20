import React from 'react';
import { Card, Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Login: React.FC = () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card style={{ width: 400, borderRadius: 12 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3}>🏛️ BoardRoom</Title>
                <Text type="secondary">CXO Council Login</Text>
            </div>
            <Form layout="vertical">
                <Form.Item name="email" rules={[{ required: true, message: 'Email required' }]}>
                    <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block size="large">Login</Button>
                <Button type="link" block style={{ marginTop: 8 }}>SSO Login</Button>
            </Form>
        </Card>
    </div>
);

export default Login;
