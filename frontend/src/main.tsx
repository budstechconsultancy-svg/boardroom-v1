import './fix-hmr';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProposalProvider } from './contexts/ProposalContext';
import { AgentProvider } from './contexts/AgentContext';
import { ConnectorProvider } from './contexts/ConnectorContext';
import './index.css';

import { ConfigProvider, theme, App as AntApp } from 'antd';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#8b5cf6',
                    borderRadius: 12,
                    fontFamily: 'Outfit, sans-serif',
                },
            }}
        >
            <AntApp>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <NotificationProvider>
                        <AgentProvider>
                            <ConnectorProvider>
                                <ProposalProvider>
                                    <App />
                                </ProposalProvider>
                            </ConnectorProvider>
                        </AgentProvider>
                    </NotificationProvider>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    </React.StrictMode>
);
