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
    source?: string;
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
    source: djangoData.metadata?.source,
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
            { name: 'Security Agent', domain: 'security' },
            { name: 'Legal Agent', domain: 'legal' }
        ];

        const roundsCount = 5;
        const messagesToSave: any[] = [];

        const deliberationTemplates: Record<string, string[]> = {
            'finance': [
                "I've analyzed the budget impact. We have sufficient runway for this.",
                "ROI projections look promising, assuming a 12-month payback period.",
                "We should consider the tax implications of this reallocation.",
                "I suggest we tighten the cost controls for this initiative.",
                "Financially sound. I'm ready to move to a vote."
            ],
            'hr': [
                "From a talent perspective, this aligns with our growth strategy.",
                "We need to ensure we have the right skillset for implementation.",
                "This could impact employee retention positively if handled well.",
                "I suggest we include a training module for the affected teams.",
                "HR supports this. The cultural fit is strong."
            ],
            'ops': [
                "Operations can support this transition with minimal downtime.",
                "We should optimize the supply chain workflow for this project.",
                "Scalability check: Our current infrastructure can handle a 20% load increase.",
                "I suggest a phased rollout to mitigate operational risks.",
                "Operational readiness confirmed. Proceed."
            ],
            'security': [
                "Security audit required. Initial assessment shows low risk.",
                "We must ensure compliance with data protection regulations.",
                "I suggest encrypting all transaction logs for this service.",
                "Firewall rules updated. Monitoring systems are in place.",
                "Security protocols met. No objections."
            ],
            'legal': [
                "Reviewing contract terms. Standard clauses seem applicable.",
                "Regulatory compliance check: No conflicts with existing laws.",
                "I suggest adding an indemnity clause for vendor interactions.",
                "Drafting final approval documents. All legal bases covered.",
                "Legally cleared. Ready for execution."
            ]
        };

        const conclusions = [
            "Initial consensus reached. Moving to detailed impact assessment.",
            "Risk mitigation strategies identified. Proceeding to final review.",
            "Counsel has reached a majority agreement on technical feasibility.",
            "Counter-arguments addressed. Finalizing executive summary.",
            "Deliberation complete. Proposal reaches unified consensus for voting."
        ];

        const evidenceLibrary: Record<string, { source: string, excerpt: string }[]> = {
            'finance': [
                { source: 'Q1 Budget Analysis', excerpt: 'Current runway exceeds projections by 20% due to OPEX optimization.' },
                { source: 'Tax Compliance Audit', excerpt: 'Reallocation of funds between business units is compliant with local regulations.' },
                { source: 'ROI Projection v2.1', excerpt: 'Expected payback period is 14 months with a 2.5x multiplier on initial investment.' }
            ],
            'hr': [
                { source: 'Retention Survey 2024', excerpt: '85% of employees cited "Growth Opportunities" as their top priority.' },
                { source: 'Market Salary Index', excerpt: 'Standard roles in this sector have seen a 12% increase in salary expectations.' },
                { source: 'Skills Gap Analysis', excerpt: 'Current team has 60% coverage for required implementation technologies.' }
            ],
            'ops': [
                { source: 'Supply Chain Log', excerpt: 'Lead times for hardware acquisition currently average 45 days.' },
                { source: 'Infrastructure Health', excerpt: 'Current server load is at 88% capacity during peak hours.' },
                { source: 'SLA Performance Report', excerpt: 'Average uptime for critical systems maintained at 99.98% over last quarter.' }
            ],
            'security': [
                { source: 'Vulnerability Assessment', excerpt: 'Zero critical vulnerabilities found in the last penetration test of core services.' },
                { source: 'Compliance ISO27001', excerpt: 'Section 5.2 - Access controls are fully aligned with industry best practices.' },
                { source: 'Threat Intelligence Feed', excerpt: 'No active exploits detected targeting our current stack in the last 30 days.' }
            ],
            'legal': [
                { source: 'Master Service Agreement', excerpt: 'Section 12.4 - Liability is clearly defined and capped at $500k.' },
                { source: 'IP Registry', excerpt: 'Proposed feature name search returned no existing trademarks in relevant jurisdictions.' },
                { source: 'Regulatory Update (Jan 24)', excerpt: 'Compliance requirements for data residency are met by our current AWS region.' }
            ]
        };

        for (let round = 1; round <= roundsCount; round++) {
            participants.forEach((agent: any) => {
                const domain = agent.domain.toLowerCase();
                const domainTemplates = deliberationTemplates[domain] || [
                    `Reviewing round ${round} details.`,
                    `I suggest we keep monitoring the progress.`,
                    `Supporting the current direction.`,
                    `Agent ${agent.name} is satisfied with the results.`,
                    `Final review round complete.`
                ];

                // Select evidence for rounds 2 and 4
                let evidence = null;
                if ((round === 2 || round === 4) && evidenceLibrary[domain]) {
                    evidence = evidenceLibrary[domain][round === 2 ? 0 : 1];
                }

                messagesToSave.push({
                    proposal: proposal.id,
                    agent_name: agent.name,
                    agent_domain: agent.domain,
                    message: domainTemplates[round - 1] || domainTemplates[0],
                    round_number: round,
                    is_conclusion: false,
                    metadata: {
                        isChallenge: round === 3 && Math.random() > 0.7,
                        evidence: evidence?.excerpt,
                        source: evidence?.source
                    }
                });
            });

            // Round Conclusion
            messagesToSave.push({
                proposal: proposal.id,
                agent_name: 'Council Lead',
                agent_domain: 'system',
                message: conclusions[round - 1],
                round_number: round,
                is_conclusion: true,
                metadata: {}
            });
        }

        try {
            // Sequential posts for order (since user wants it "quick", we just fire them)
            // In a real app, a batch endpoint is better
            await Promise.all(messagesToSave.map(msg => apiClient.post('/proposals/messages/', msg)));

            // Set status to voting after 5 rounds
            await apiClient.patch(`/proposals/${proposal.id}/`, { status: 'voting' });

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
                message: `QUERY: ${query}`,
                round_number: nextRound,
                metadata: { isChallenge: true }
            });

            const activeParticipants = agents.filter(a => a.active && a.domain !== 'ceo');
            const participants = activeParticipants.length > 0 ? activeParticipants : [
                { name: 'Finance Agent', domain: 'finance' },
                { name: 'Ops Agent', domain: 'ops' }
            ];

            for (const agent of participants) {
                await apiClient.post('/proposals/messages/', {
                    proposal: proposalId,
                    agent_name: agent.name,
                    agent_domain: agent.domain,
                    message: `Response to "${query}": We have reviewed the data and suggest proceeding with the original plan with minor adjustments.`,
                    round_number: nextRound,
                    metadata: { isResponse: true }
                });
            }

            await apiClient.post('/proposals/messages/', {
                proposal: proposalId,
                agent_name: 'Council Lead',
                agent_domain: 'system',
                message: `Final consensus reached after query. Moving to voting phase.`,
                round_number: nextRound,
                is_conclusion: true
            });

            await apiClient.patch(`/proposals/${proposalId}/`, { status: 'voting' });
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
