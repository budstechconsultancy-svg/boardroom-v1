import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProposalProvider } from './contexts/ProposalContext';
import { AgentProvider } from './contexts/AgentContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <NotificationProvider>
                <AgentProvider>
                    <ProposalProvider>
                        <App />
                    </ProposalProvider>
                </AgentProvider>
            </NotificationProvider>
        </BrowserRouter>
    </React.StrictMode>
);
