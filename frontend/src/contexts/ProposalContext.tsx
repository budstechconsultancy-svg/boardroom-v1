import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNotifications } from './NotificationContext';
import { useAgents } from './AgentContext';
import apiClient from '../api/client';

// Types
export interface Proposal {
    id: string;
    title: string;
    domain: string;
    description: string;
    status: 'deliberating' | 'voting' | 'approved' | 'rejected' | 'pending_ceo' | 'executed';
    riskTier: 'low' | 'medium' | 'high';
    confidence: number;
    createdAt: string;
    proposer?: string;
    impactSummary?: string;
}

export interface Conversation {
    id?: string;
    agent: string;
    domain: string;
    message: string;
    timestamp: string;
    roundNumber: number;
    isConclusion: boolean;
    isChallenge?: boolean;
    isResponse?: boolean;
    evidence?: string;
}

export interface Round {
    round: number;
    phase: string;
    conversations: Conversation[];
    conclusion?: string;
}

export interface ProposalContextType {
    proposals: Proposal[];
    loading: boolean;
    delibs_ready: boolean;
    deliberations: Record<string, Round[]>;
    votes: Record<string, any[]>;
    refreshProposals: () => Promise<void>;
    addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'riskTier' | 'confidence'>) => Promise<void>;
    updateProposalStatus: (id: string, status: Proposal['status']) => Promise<void>;
    getDeliberation: (id: string) => Round[];
    generateDeliberation: (proposal: Proposal) => Promise<void>;
    addInfoRequest: (proposalId: string, query: string) => Promise<void>;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

// Mapping Functions
const mapDjangoToProposal = (djangoData: any): Proposal => ({
    id: djangoData.id.toString(),
    title: djangoData.title,
    domain: djangoData.domain || '',
    description: djangoData.description,
    status: djangoData.status as Proposal['status'],
    riskTier: djangoData.risk_tier as Proposal['riskTier'],
    confidence: djangoData.confidence,
    createdAt: djangoData.created_at ? new Date(djangoData.created_at).toISOString().split('T')[0] : '',
    proposer: djangoData.proposer,
    impactSummary: djangoData.impact_summary,
});

const mapProposalToDjango = (proposal: Partial<Proposal>): any => {
    const djangoData: any = {};
    if (proposal.title) djangoData.title = proposal.title;
    if (proposal.domain) djangoData.domain = proposal.domain;
    if (proposal.description) djangoData.description = proposal.description;
    if (proposal.status) djangoData.status = proposal.status;
    if (proposal.riskTier) djangoData.risk_tier = proposal.riskTier;
    if (proposal.confidence !== undefined) djangoData.confidence = proposal.confidence;
    if (proposal.proposer) djangoData.proposer = proposal.proposer;
    if (proposal.impactSummary) djangoData.impact_summary = proposal.impactSummary;
    return djangoData;
};

const mapDjangoToConversation = (djangoData: any): Conversation => ({
    id: djangoData.id.toString(),
    agent: djangoData.agent_name,
    domain: djangoData.agent_domain,
    message: djangoData.message,
    timestamp: new Date(djangoData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    roundNumber: djangoData.round_number || 1,
    isConclusion: djangoData.is_conclusion || false,
    isChallenge: djangoData.metadata?.isChallenge,
    isResponse: djangoData.metadata?.isResponse,
    evidence: djangoData.metadata?.evidence,
});

export const ProposalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [deliberations, setDeliberations] = useState<Record<string, Round[]>>({});
    const [votes, setVotes] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [delibs_ready, setDelibsReady] = useState(false);

    const { addNotification } = useNotifications();
    const { agents } = useAgents();

    const refreshProposals = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/proposals/');
            const mappedProposals = response.data.map(mapDjangoToProposal);
            setProposals(mappedProposals);

            // Fetch deliberations for each proposal
            const delibs: Record<string, Round[]> = {};
            for (const p of mappedProposals) {
                const msgsResponse = await apiClient.get(`/proposals/${p.id}/`);
                if (msgsResponse.data.messages && msgsResponse.data.messages.length > 0) {
                    const convs = msgsResponse.data.messages.map(mapDjangoToConversation);

                    // Group into rounds
                    const groupedRounds: Record<number, Round> = {};
                    convs.forEach((c: Conversation) => {
                        if (!groupedRounds[c.roundNumber]) {
                            groupedRounds[c.roundNumber] = {
                                round: c.roundNumber,
                                phase: `Phase ${c.roundNumber}: ${getPhaseName(c.roundNumber)}`,
                                conversations: []
                            };
                        }
                        if (c.isConclusion) {
                            groupedRounds[c.roundNumber].conclusion = c.message;
                        } else {
                            groupedRounds[c.roundNumber].conversations.push(c);
                        }
                    });

                    delibs[p.id] = Object.values(groupedRounds).sort((a, b) => a.round - b.round);
                }
            }
            setDeliberations(delibs);
            setDelibsReady(true);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPhaseName = (round: number) => {
        const phases = ['Initial Review', 'Impact Assessment', 'Risk Evaluation', 'Counter-Argument', 'Final Consensus'];
        return phases[round - 1] || 'Council Deliberation';
    };

    useEffect(() => {
        refreshProposals();
    }, []);

    const addProposal = async (newProposalData: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'riskTier' | 'confidence'>) => {
        try {
            const djangoData = mapProposalToDjango({
                ...newProposalData,
                status: 'deliberating',
                riskTier: 'medium',
                confidence: 0.75,
                proposer: `${newProposalData.domain} Agent`
            });
            const response = await apiClient.post('/proposals/', djangoData);
            const newProposal = mapDjangoToProposal(response.data);

            setProposals(prev => [newProposal, ...prev]);

            // Start generation in background to be "quick" for the user redirect
            generateDeliberation(newProposal);

            addNotification({
                type: 'proposal',
                title: 'New Proposal Submitted',
                message: `Proposal "${newProposal.title}" has been submitted by ${newProposal.proposer || 'CXO Agent'} for multi-round deliberation.`
            });
        } catch (error) {
            console.error('Error adding proposal:', error);
            throw error;
        }
    };

    const updateProposalStatus = async (id: string, status: Proposal['status']) => {
        try {
            await apiClient.patch(`/proposals/${id}/`, { status });
            setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    };

    const generateDeliberation = async (proposal: Proposal) => {
        const activeParticipants = agents.filter(a => a.active && a.domain !== 'ceo');
        const participants = activeParticipants.length > 0 ? activeParticipants : [
            { name: 'Finance Agent', domain: 'finance' },
            { name: 'HR Agent', domain: 'hr' },
            { name: 'Ops Agent', domain: 'ops' },
            { name: 'Security Agent', domain: 'security' }
        ];

        const roundsCount = 5;
        const messagesToSave: any[] = [];

        // Domain-specific evidence snippets
        const evidenceBase: Record<string, any[]> = {
            'Finance': [
                { source: 'Q4 Budget Analysis', excerpt: 'Current runway exceeds projections by 20% due to OPEX optimization.' },
                { source: 'Tax Compliance Audit', excerpt: 'Reallocation of funds between business units is compliant with local regulations.' }
            ],
            'HR': [
                { source: 'Retention Survey 2024', excerpt: '85% of employees cited "Growth Opportunities" as their top priority.' },
                { source: 'Market Salary Index', excerpt: 'Standard roles in this sector have seen a 12% increase in salary expectations.' }
            ],
            'Operations': [
                { source: 'Supply Chain Log', excerpt: 'Lead times for hardware acquisition currently average 45 days.' },
                { source: 'Infrastructure Health', excerpt: 'Current server load is at 88% capacity during peak hours.' }
            ]
        };

        const defaultEvidence = [{ source: 'General Policy', excerpt: 'Proposal aligns with standard corporate operational guidelines.' }];

        for (let round = 1; round <= roundsCount; round++) {
            // Each agent speaks in each round
            participants.forEach((agent: any, idx: number) => {
                let stance = 'neutral';
                let messageText = '';
                const seed = Math.random();

                if (round === 1) {
                    messageText = `Reviewing "${proposal.title}" from ${agent.name} perspective. Initial check looks positive.`;
                } else if (round === 2) {
                    messageText = `Analyzing long-term impacts. I suggest we consider the scalability of this idea.`;
                } else if (round === 3) {
                    if (seed > 0.7) {
                        messageText = `I have minor concerns about the timeline mentioned. Can we expedite?`;
                        stance = 'challenge';
                    } else {
                        messageText = `I agree with the operational feasibility proposed here.`;
                        stance = 'approve';
                    }
                } else if (round === 4) {
                    messageText = `Given the evidence, this seems like a solid path forward for the organization.`;
                } else {
                    messageText = seed > 0.2 ? `Final verdict: Supportive.` : `I will abstain from voting on this as it falls slightly outside my primary jurisdiction.`;
                }

                const msgEvidence = (round === 2 || round === 4) ? (evidenceBase[agent.domain] || defaultEvidence)[idx % 2] : null;

                messagesToSave.push({
                    proposal: proposal.id,
                    agent_name: agent.name,
                    agent_domain: agent.domain,
                    message: messageText,
                    round_number: round,
                    is_conclusion: false,
                    metadata: {
                        isChallenge: stance === 'challenge',
                        evidence: msgEvidence ? msgEvidence.excerpt : undefined,
                        source: msgEvidence ? msgEvidence.source : undefined
                    }
                });
            });

            // Round Conclusion
            messagesToSave.push({
                proposal: proposal.id,
                agent_name: 'Council Lead',
                agent_domain: 'system',
                message: `Round ${round} concluded. Consensus is building around ${round < 3 ? 'initial assessment' : 'execution details'}.`,
                round_number: round,
                is_conclusion: true,
                metadata: {}
            });
        }

        try {
            // Save all messages in sequence (ideally batch, but sequential for simplicity here)
            for (const msg of messagesToSave) {
                await apiClient.post('/proposals/messages/', msg);
            }
            await refreshProposals();
        } catch (error) {
            console.error('Error generating deliberation:', error);
        }
    };

    const addInfoRequest = async (proposalId: string, query: string) => {
        try {
            const currentRounds = deliberations[proposalId] || [];
            const nextRound = currentRounds.length + 1;

            await apiClient.post('/proposals/messages/', {
                proposal: proposalId,
                agent_name: 'User (Admin)',
                agent_domain: 'admin',
                message: `REQUEST FOR INFO: ${query}`,
                round_number: nextRound,
                metadata: { isChallenge: true }
            });

            const activeParticipants = agents.filter(a => a.active && a.domain !== 'ceo');
            for (const agent of activeParticipants) {
                await apiClient.post('/proposals/messages/', {
                    proposal: proposalId,
                    agent_name: agent.name,
                    agent_domain: agent.domain,
                    message: `Understood. Regarding "${query}", we will update our models.`,
                    round_number: nextRound,
                    metadata: { isResponse: true }
                });
            }

            await refreshProposals();
        } catch (error) {
            console.error('Error adding info request:', error);
        }
    };

    const getDeliberation = (id: string) => {
        return deliberations[id] || [];
    };

    return (
        <ProposalContext.Provider value={{
            proposals,
            loading,
            delibs_ready,
            deliberations,
            votes,
            refreshProposals,
            addProposal,
            updateProposalStatus,
            getDeliberation,
            generateDeliberation,
            addInfoRequest
        }}>
            {children}
        </ProposalContext.Provider>
    );
};

export const useProposals = () => {
    const context = useContext(ProposalContext);
    if (context === undefined) {
        throw new Error('useProposals must be used within a ProposalProvider');
    }
    return context;
};
