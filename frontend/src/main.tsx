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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
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
    </React.StrictMode>
);
