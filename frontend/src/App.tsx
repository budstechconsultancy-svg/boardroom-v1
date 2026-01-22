import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Proposals from './pages/Proposals';
import ProposalDetail from './pages/ProposalDetail';
import Agents from './pages/Agents';
import Connectors from './pages/Connectors';
import Meetings from './pages/Meetings';
import Admin from './pages/Admin';
import Login from './pages/Login';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="proposals" element={<Proposals />} />
                <Route path="proposals/:id" element={<ProposalDetail />} />
                <Route path="agents" element={<Agents />} />
                <Route path="connectors" element={<Connectors />} />
                <Route path="meetings" element={<Meetings />} />
                <Route path="admin/*" element={<Admin />} />
            </Route>
        </Routes>
    );
};

export default App;
