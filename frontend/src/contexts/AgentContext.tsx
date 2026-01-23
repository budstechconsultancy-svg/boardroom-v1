import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api/client';

export interface Agent {
    id?: number;
    name: string;
    domain: string;
    description: string;
    active: boolean;
    weight: number;
    canExecute: boolean;
    llmModel?: string;
    ragEnabled?: boolean;
    knowledgeBase?: string;
}

interface AgentContextType {
    agents: Agent[];
    loading: boolean;
    addAgent: (agent: Agent) => Promise<void>;
    updateAgent: (domain: string, updates: Partial<Agent>) => Promise<void>;
    toggleAgent: (domain: string) => Promise<void>;
    deleteAgent: (domain: string) => Promise<void>;
    getAgentByDomain: (domain: string) => Agent | undefined;
    refreshAgents: () => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const mapDjangoToAgent = (djangoAgent: any): Agent => {
    const config = djangoAgent.configuration || {};
    return {
        id: djangoAgent.id,
        name: djangoAgent.name,
        // Using a mapping for domain or assuming name-based domain if not provided
        domain: djangoAgent.name.toLowerCase().replace(/\s+agent/g, '').replace(/\s+/g, '_'),
        description: djangoAgent.role,
        active: djangoAgent.is_active,
        weight: djangoAgent.vote_weight,
        canExecute: djangoAgent.can_execute,
        llmModel: config.llmModel || 'gpt-4',
        ragEnabled: config.ragEnabled || false,
        knowledgeBase: config.knowledgeBase,
    };
};

const mapAgentToDjango = (agent: Partial<Agent>): any => {
    const djangoAgent: any = {};
    if (agent.name) djangoAgent.name = agent.name;
    if (agent.description) djangoAgent.role = agent.description;
    if (agent.active !== undefined) djangoAgent.is_active = agent.active;
    if (agent.weight !== undefined) djangoAgent.vote_weight = agent.weight;
    if (agent.canExecute !== undefined) djangoAgent.can_execute = agent.canExecute;

    djangoAgent.configuration = {
        llmModel: agent.llmModel,
        ragEnabled: agent.ragEnabled,
        knowledgeBase: agent.knowledgeBase,
    };
    return djangoAgent;
};

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshAgents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/agents/');
            // Backend returns { agents: [...], total: ... }
            const agentList = response.data.agents || [];
            const mappedAgents = agentList.map(mapDjangoToAgent);
            setAgents(mappedAgents);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAgents();
    }, []);

    const addAgent = async (agent: Agent) => {
        try {
            const djangoData = mapAgentToDjango(agent);
            const response = await api.post('/agents/', djangoData);
            setAgents(prev => [...prev, mapDjangoToAgent(response.data)]);
        } catch (error) {
            console.error('Failed to add agent:', error);
        }
    };

    const updateAgent = async (domain: string, updates: Partial<Agent>) => {
        const agent = agents.find(a => a.domain === domain);
        if (!agent || !agent.id) return;

        try {
            const djangoData = mapAgentToDjango({ ...agent, ...updates });
            const response = await api.patch(`/agents/${agent.id}/`, djangoData);
            setAgents(prev => prev.map(a => a.domain === domain ? mapDjangoToAgent(response.data) : a));
        } catch (error) {
            console.error('Failed to update agent:', error);
        }
    };

    const toggleAgent = async (domain: string) => {
        const agent = agents.find(a => a.domain === domain);
        if (!agent || !agent.id) return;

        try {
            const response = await api.patch(`/agents/${agent.id}/`, { is_active: !agent.active });
            setAgents(prev => prev.map(a => a.domain === domain ? mapDjangoToAgent(response.data) : a));
        } catch (error) {
            console.error('Failed to toggle agent:', error);
        }
    };

    const deleteAgent = async (domain: string) => {
        const agent = agents.find(a => a.domain === domain);
        if (!agent || !agent.id) return;

        try {
            await api.delete(`/agents/${agent.id}/`);
            setAgents(prev => prev.filter(a => a.domain !== domain));
        } catch (error) {
            console.error('Failed to delete agent:', error);
            throw error;
        }
    };

    const getAgentByDomain = (domain: string) => {
        return agents.find(a => a.domain === domain);
    };

    return (
        <AgentContext.Provider value={{ agents, loading, addAgent, updateAgent, toggleAgent, deleteAgent, getAgentByDomain, refreshAgents }}>
            {children}
        </AgentContext.Provider>
    );
};

export const useAgents = () => {
    const context = useContext(AgentContext);
    if (!context) {
        throw new Error('useAgents must be used within an AgentProvider');
    }
    return context;
};
