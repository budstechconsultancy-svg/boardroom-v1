import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Agent {
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
    addAgent: (agent: Agent) => void;
    updateAgent: (domain: string, updates: Partial<Agent>) => void;
    toggleAgent: (domain: string) => void;
    getAgentByDomain: (domain: string) => Agent | undefined;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const initialAgents: Agent[] = [
    { name: 'CEO Agent', domain: 'ceo', description: 'Final authority - AI/Human/Hybrid', active: true, weight: 2.0, canExecute: true, llmModel: 'gpt-4', ragEnabled: true, knowledgeBase: 'Corporate Strategy' },
    { name: 'HR Agent', domain: 'hr', description: 'Workforce and HR decisions', active: true, weight: 1.0, canExecute: true, llmModel: 'gpt-4', ragEnabled: false },
    { name: 'Finance Agent', domain: 'finance', description: 'Financial decisions and controls', active: true, weight: 1.5, canExecute: true, llmModel: 'gpt-4', ragEnabled: true, knowledgeBase: 'Financial Reports' },
    { name: 'Ops Agent', domain: 'ops', description: 'Operations and efficiency', active: true, weight: 1.0, canExecute: true, llmModel: 'gpt-4', ragEnabled: true, knowledgeBase: 'Operational Procedures' },
    { name: 'Sales Agent', domain: 'sales', description: 'Revenue and sales decisions', active: false, weight: 1.0, canExecute: false, llmModel: 'gpt-3.5-turbo', ragEnabled: false },
    { name: 'Legal Agent', domain: 'legal', description: 'Compliance and legal review', active: true, weight: 1.5, canExecute: false, llmModel: 'gpt-4', ragEnabled: true, knowledgeBase: 'Legal Acts & Regulations' },
    { name: 'IT Security Agent', domain: 'it_security', description: 'Security and access control', active: true, weight: 1.0, canExecute: false, llmModel: 'gpt-4', ragEnabled: true, knowledgeBase: 'Security Protocols' },
    { name: 'Procurement Agent', domain: 'procurement', description: 'Vendor and supply decisions', active: false, weight: 1.0, canExecute: true, llmModel: 'gpt-3.5-turbo', ragEnabled: false },
    { name: 'Customer Success', domain: 'customer', description: 'Customer retention', active: false, weight: 1.0, canExecute: false, llmModel: 'gpt-3.5-turbo', ragEnabled: false },
    { name: 'Product Agent', domain: 'product', description: 'Product roadmap', active: false, weight: 1.0, canExecute: false, llmModel: 'gpt-4', ragEnabled: false },
];

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available, otherwise use default
    const [agents, setAgents] = useState<Agent[]>(() => {
        const savedAgents = localStorage.getItem('cxo_agents');
        return savedAgents ? JSON.parse(savedAgents) : initialAgents;
    });

    // Save to localStorage whenever agents change
    React.useEffect(() => {
        localStorage.setItem('cxo_agents', JSON.stringify(agents));
    }, [agents]);

    const addAgent = (agent: Agent) => {
        setAgents(prev => [...prev, agent]);
    };

    const updateAgent = (domain: string, updates: Partial<Agent>) => {
        setAgents(prev => prev.map(a => a.domain === domain ? { ...a, ...updates } : a));
    };

    const toggleAgent = (domain: string) => {
        setAgents(prev => prev.map(a => a.domain === domain ? { ...a, active: !a.active } : a));
    };

    const getAgentByDomain = (domain: string) => {
        return agents.find(a => a.domain === domain);
    };

    return (
        <AgentContext.Provider value={{ agents, addAgent, updateAgent, toggleAgent, getAgentByDomain }}>
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
