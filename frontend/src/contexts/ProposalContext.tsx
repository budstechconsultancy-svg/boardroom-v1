import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useNotifications } from './NotificationContext';
import { useAgents } from './AgentContext';

// Types
export interface Proposal {
    id: string;
    title: string;
    domain: string;
    description: string;
    status: 'deliberating' | 'voting' | 'approved' | 'rejected' | 'pending_ceo';
    riskTier: 'low' | 'medium' | 'high';
    confidence: number;
    createdAt: string;
    proposer?: string;
    impactSummary?: string;
}

export interface Conversation {
    agent: string;
    domain: string;
    message: string;
    timestamp: string;
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

interface ProposalContextType {
    proposals: Proposal[];
    deliberations: Record<string, Round[]>;
    votes: Record<string, any[]>;
    addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'riskTier' | 'confidence'>) => void;
    updateProposalStatus: (id: string, status: Proposal['status']) => void;
    getDeliberation: (id: string) => Round[];
    generateDeliberation: (proposal: Proposal) => void;
    addInfoRequest: (proposalId: string, query: string) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial Mock Data
    // Initialize from localStorage
    const [proposals, setProposals] = useState<Proposal[]>(() => {
        const saved = localStorage.getItem('cxo_proposals');
        return saved ? JSON.parse(saved) : [
            { id: 'P-001', title: 'Q1 Budget Reallocation', domain: 'Finance', description: 'Proposal to reallocate $50,000 from unused training budget to marketing initiatives for Q1 campaign.', status: 'approved', riskTier: 'medium', confidence: 0.92, createdAt: '2024-01-15', proposer: 'Finance Agent' },
            { id: 'P-002', title: 'New Hire: Senior Developer', domain: 'HR', description: 'Request for headcount increase to hire a Senior Full-stack Developer to accelerate product roadmap execution.', status: 'voting', riskTier: 'low', confidence: 0.85, createdAt: '2024-01-16', proposer: 'HR Agent' },
            { id: 'P-003', title: 'Inventory Optimization', domain: 'Ops', description: 'Implementation of AI-driven inventory management system to reduce holding costs by 12%.', status: 'deliberating', riskTier: 'medium', confidence: 0.78, createdAt: '2024-01-17', proposer: 'Ops Agent' },
            { id: 'P-004', title: 'Major Vendor Contract', domain: 'Procurement', description: 'Renewal of cloud infrastructure contract with a 3-year commitment for a 15% discount.', status: 'pending_ceo', riskTier: 'high', confidence: 0.65, createdAt: '2024-01-18', proposer: 'Procurement Agent' },
        ];
    });

    const [deliberations, setDeliberations] = useState<Record<string, Round[]>>(() => {
        const saved = localStorage.getItem('cxo_deliberations');
        return saved ? JSON.parse(saved) : {};
    });

    const [votes, setVotes] = useState<Record<string, any[]>>(() => {
        const saved = localStorage.getItem('cxo_votes');
        return saved ? JSON.parse(saved) : {};
    });

    // Save to localStorage
    React.useEffect(() => {
        localStorage.setItem('cxo_proposals', JSON.stringify(proposals));
        localStorage.setItem('cxo_deliberations', JSON.stringify(deliberations));
        localStorage.setItem('cxo_votes', JSON.stringify(votes));
    }, [proposals, deliberations, votes]);

    const { addNotification } = useNotifications();
    const { agents } = useAgents();

    const addProposal = (newProposalData: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'riskTier' | 'confidence'>) => {
        const newProposal: Proposal = {
            ...newProposalData,
            id: `P-00${proposals.length + 1}`,
            status: 'deliberating',
            riskTier: 'medium', // Default
            confidence: 0.75,   // Default
            createdAt: new Date().toISOString().split('T')[0],
            proposer: `${newProposalData.domain} Agent`
        };
        setProposals(prev => [newProposal, ...prev]);
        generateDeliberation(newProposal);

        // Trigger Notification
        addNotification({
            type: 'proposal',
            title: 'New Proposal Submitted',
            message: `Proposal "${newProposal.title}" has been submitted by ${newProposal.proposer || 'CXO Agent'} for deliberation.`
        });
    };

    const updateProposalStatus = (id: string, status: Proposal['status']) => {
        setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));

        const proposal = proposals.find(p => p.id === id);
        if (proposal) {
            let notificationTitle = '';
            let notificationMsg = '';

            if (status === 'voting') {
                notificationTitle = 'Deliberation Complete';
                notificationMsg = `Deliberation concluded for "${proposal.title}". Voting session has started.`;
            } else if (status === 'approved') {
                notificationTitle = 'Proposal Verified & Approved';
                notificationMsg = `Proposal "${proposal.title}" has been approved by the council. Execution sequence initiated.`;
            } else if (status === 'rejected') {
                notificationTitle = 'Proposal Rejected';
                notificationMsg = `Proposal "${proposal.title}" was rejected by the council.`;
            }

            if (notificationTitle) {
                addNotification({
                    type: 'decision', // Using decision type for status updates
                    title: notificationTitle,
                    message: notificationMsg
                });
            }
        }
    };

    const generateDeliberation = (proposal: Proposal) => {
        if (deliberations[proposal.id]) return;

        const activeParticipants = agents.filter(a => a.active && a.domain !== 'ceo');
        const participants = activeParticipants.length > 0 ? activeParticipants : [
            { name: 'Finance Agent', domain: 'Finance' },
            { name: 'HR Agent', domain: 'HR' }
        ];

        // 1. Assign Stances (Support: 60%, Oppose: 20%, Abstain: 20%)
        const stances: Record<string, 'approve' | 'reject' | 'abstain'> = {};
        participants.forEach(p => {
            const r = Math.random();
            stances[p.domain] = r > 0.4 ? 'approve' : (r > 0.2 ? 'reject' : 'abstain');
        });

        // Conversational Templates
        const templates: Record<string, any> = {
            finance: {
                initial: [
                    `I've reviewed the numbers for "${proposal.title}". The ROI looks promising, but we need to be careful with cash flow.`,
                    `From a financial perspective, "${proposal.title}" fits our Q3 goals, though the upfront cost is higher than I'd like.`,
                    `I'm analyzing the budget impact of "${proposal.title}". It's a significant investment, so we need to ensure the returns are there.`
                ],
                challenge: [
                    `I'm concerned about the hidden costs here. Have we accounted for maintenance?`,
                    `The budget buffer seems too thin. What if we overrun?`
                ],
                agreement: [
                    `That's a fair point. If the revenue projections hold, the cost is justified.`,
                    `I agree. The long-term savings outweigh the immediate expense.`
                ],
                suggestion: [
                    `Suggestion: We should phase the investment over two quarters to reduce risk.`,
                    `I recommend we set strict spending caps on this initiative.`
                ],
                dissent: [
                    `I cannot support this at the current price point. It pushes us into the red.`,
                    `The risks outweigh the rewards here. I recommend we request a revised budget.`,
                    `Disagreed. This allocation is better spent elsewhere.`
                ]
            },
            hr: {
                initial: [
                    `I'm looking at "${proposal.title}" from a talent perspective. It could really boost team morale.`,
                    `Reviewing "${proposal.title}" for cultural fit. We need to make sure our people are ready for this change.`,
                    `From an HR standpoint, "${proposal.title}" is interesting. It addresses some key employee feedback.`
                ],
                challenge: [
                    `I'm worried about the training burden on the team. Do we have the bandwidth?`,
                    `This might cause some friction if not communicated well.`
                ],
                agreement: [
                    `You're right. Change management will be critical here.`,
                    `I agree. If we support the team properly, this will be a big win.`
                ],
                suggestion: [
                    `Suggestion: Let's roll this out to a pilot group first to gauge reaction.`,
                    `I suggest we bundle this with a training workshop.`
                ],
                dissent: [
                    `I don't think the team is ready for this change. It will cause burnout.`,
                    `This proposal ignores our current hiring freeze constraints.`,
                    `I have to oppose. The cultural impact is too negative.`
                ]
            },
            ops: {
                initial: [
                    `Checking the operational feasibility of "${proposal.title}". It looks scalable, which is good.`,
                    `From an Ops view, "${proposal.title}" could streamline our workflows significantly.`,
                    `I'm assessing the implementation checks for "${proposal.title}". Efficiency is the name of the game.`
                ],
                challenge: [
                    `The integration timeline looks too aggressive. Things always take longer.`,
                    `I'm concerned about the load on our current infrastructure.`
                ],
                agreement: [
                    `Valid concern. We can pad the schedule to be safe.`,
                    `Agreed. Reliability has to be our top priority.`
                ],
                suggestion: [
                    `Suggestion: We should automate the reporting for this to save time.`,
                    `I recommend a phased rollout to minimize downtime.`
                ],
                dissent: [
                    `This is operational suicide. We don't have the redundancy for this.`,
                    `The complexity here is too high. I vote no until we simplify.`,
                    `Opposed. This breaks our current SLA commitments.`
                ]
            },
            legal: {
                initial: [
                    `I've scanned "${proposal.title}" for compliance risks. It seems mostly standard, but there are a few clauses to watch.`,
                    `From Legal: "${proposal.title}" needs a tight contract to protect our IP.`,
                    `Reviewing the regulatory implications of "${proposal.title}". We play by the rules.`
                ],
                challenge: [
                    `Are we sure we're covered on the data privacy front here?`,
                    `This exposes us to some liability if the vendor fails.`
                ],
                agreement: [
                    `Good point. We can add an indemnity clause to handle that.`,
                    `I agree. Better safe than sorry.`
                ],
                suggestion: [
                    `Suggestion: Let's have external counsel review the final terms.`,
                    `I suggest a mandatory compliance check before go-live.`
                ],
                dissent: [
                    `This is a compliance nightmare. I cannot sign off on this.`,
                    `Too much regulatory risk. We need to pause and reassess.`,
                    `Opposed due to potential GDPR violations.`
                ]
            },
            sales: {
                initial: [
                    `I love "${proposal.title}". This is exactly what our customers have been asking for!`,
                    `From a Sales perspective, "${proposal.title}" could really help us close the Q4 gap.`,
                    `Evaluating the market potential of "${proposal.title}". It's a competitive differentiator.`
                ],
                challenge: [
                    `I'm not sure if the market is ready for this price point.`,
                    `Will this distract us from our core product offerings?`
                ],
                agreement: [
                    `That's true, but the upsell potential is huge.`,
                    `I agree, we need to focus on the value proposition.`
                ],
                suggestion: [
                    `Suggestion: Let's create a bundle offer for early adopters.`,
                    `I recommend we get some customer testimonials during the beta.`
                ],
                dissent: [
                    `Our customers won't pay for this. It's a waste of resources.`,
                    `This cannibalizes our existing premium tier. I'm voting no.`,
                    `Opposed. The market timing is all wrong.`
                ]
            },
            security: {
                initial: [
                    `I'm running a security assessment on "${proposal.title}". Data integrity is non-negotiable.`,
                    `From Security: "${proposal.title}" introduces some new attack vectors we need to secure.`,
                    `Reviewing the access controls for "${proposal.title}". We need to stay zero-trust.`
                ],
                challenge: [
                    `This third-party integration makes me nervous about data leaks.`,
                    `We haven't defined the encryption standards for this yet.`
                ],
                agreement: [
                    `Fair. We can enforce end-to-end encryption to mitigate that.`,
                    `I agree. Security by design is the only way.`
                ],
                suggestion: [
                    `Suggestion: Let's require MFA for all admin evaluations of this.`,
                    `I suggest a penetration test before we go live.`
                ],
                dissent: [
                    `Critical vulnerability identified. I'm blocking this immediately.`,
                    `We fail compliance usage standards with this tool. Opposed.`,
                    `Too risky. We can't secure this properly.`
                ]
            },
            procurement: {
                initial: [
                    `I'm looking at the vendor options for "${proposal.title}". We can probably negotiate a better rate.`,
                    `From Procurement: "${proposal.title}" aligns with our strategic sourcing goals.`,
                    `Analyzing the supply chain impact of "${proposal.title}". We need reliable partners.`
                ],
                challenge: [
                    `This vendor has a history of delays. Can we trust them?`,
                    `The contract terms are a bit rigid on cancellation.`
                ],
                agreement: [
                    `True. We should have a backup vendor lined up just in case.`,
                    `I agree. We need flexibility in the SLA.`
                ],
                suggestion: [
                    `Suggestion: Let's push for a net-60 payment term.`,
                    `I suggest we consolidate this with our existing cloud contract.`
                ],
                dissent: [
                    `Vendor failed our due diligence. I cannot approve.`,
                    `The pricing is 20% above market rate. Rejected.`,
                    `Opposed. We have better options in our approved supplier list.`
                ]
            },
            product: {
                initial: [
                    `I'm excited about "${proposal.title}". It adds real value to our user journey.`,
                    `From Product: "${proposal.title}" fills a major gap in our roadmap.`,
                    `Reviewing the UX implications of "${proposal.title}". It needs to be intuitive.`
                ],
                challenge: [
                    `Is this feature creep? We need to stay focused.`,
                    `I'm worried this will clutter the interface.`
                ],
                agreement: [
                    `You're right. We should keep the MVP simple.`,
                    `I agree. Usability testing will be crucial.`
                ],
                suggestion: [
                    `Suggestion: Let's A/B test the placement of this feature.`,
                    `I recommend we interview five key customers before building.`
                ],
                dissent: [
                    `This doesn't solve a real user problem. Opposed.`,
                    `It adds too much friction to the signup flow. I vote no.`,
                    `Rejected. It diverts focus from our Q1 OKRs.`
                ]
            }
        };

        const fallback = {
            initial: [`I'm analyzing "${proposal.title}" against our strategic objectives.`],
            challenge: [`I have some reservations about the scope.`],
            agreement: [`That makes sense. I see the value.`],
            suggestion: [`Suggestion: Let's proceed with caution.`],
            dissent: [`I have significant concerns and cannot support this.`]
        };

        const getMsg = (domain: string, type: 'initial' | 'challenge' | 'agreement' | 'suggestion' | 'dissent') => {
            const key = domain.toLowerCase();
            const set = templates[key] || fallback;
            const options = set[type] || fallback[type] || fallback['agreement'];
            return options[Math.floor(Math.random() * options.length)];
        };

        const generatedRounds: Round[] = [
            {
                round: 1,
                phase: 'Initial Analysis',
                conversations: participants.map((agent, index) => {
                    const stance = stances[agent.domain];
                    return {
                        agent: agent.name,
                        domain: agent.domain,
                        message: getMsg(agent.domain, 'initial'),
                        timestamp: `10:0${index} AM`
                    };
                })
            },
            {
                round: 2,
                phase: 'Challenge & Discussion',
                conversations: participants.map((agent, index) => {
                    const stance = stances[agent.domain];
                    const isChallenge = index % 2 === 0;

                    let text = "";
                    let evidence = undefined;
                    if (stance === 'reject') {
                        text = getMsg(agent.domain, 'dissent');
                        if (Math.random() > 0.6) evidence = "Compliance Violation Report #402";
                    } else if (stance === 'abstain') {
                        text = "I am currently neutral on this topic. I need to see more data before committing.";
                    } else {
                        const msgType = isChallenge ? 'challenge' : 'agreement';
                        text = getMsg(agent.domain, msgType);
                        if (Math.random() > 0.5) text += " " + getMsg(agent.domain, 'suggestion');
                        if (Math.random() > 0.7) evidence = "Q3 Performance Metrics";
                    }

                    return {
                        agent: agent.name,
                        domain: agent.domain,
                        message: text,
                        timestamp: `10:1${index} AM`,
                        isChallenge: isChallenge,
                        isResponse: !isChallenge,
                        evidence: evidence
                    };
                })
            },
            {
                round: 3,
                phase: 'Risk Mitigation',
                conversations: participants.map((agent, index) => {
                    return {
                        agent: agent.name,
                        domain: agent.domain,
                        message: `Addressing the concerns raised in Round 2. From ${agent.domain} view, we can mitigate risks by implementing stricter controls.`,
                        timestamp: `10:2${index} AM`,
                        evidence: Math.random() > 0.5 ? "Risk Mitigation Plan v1.0" : undefined
                    };
                })
            },
            {
                round: 4,
                phase: 'Cross-functional Alignment',
                conversations: participants.map((agent, index) => {
                    return {
                        agent: agent.name,
                        domain: agent.domain,
                        message: `We are seeing alignment across departments now. The proposed changes match our ${agent.domain} strategic goals for the next fiscal year.`,
                        timestamp: `10:3${index} AM`
                    };
                })
            },
            {
                round: 5,
                phase: 'Final Synthesis',
                conversations: participants.map((agent, index) => {
                    const stance = stances[agent.domain];
                    let text = "";

                    if (stance === 'approve') {
                        text = `After 5 rounds of deliberation, I support moving forward. ${getMsg(agent.domain, 'agreement')}`;
                    } else if (stance === 'reject') {
                        text = `My concerns remain unaddressed. I am voting against this proposal.`;
                    } else {
                        text = `I do not have enough conviction to block or support. I will abstain.`;
                    }

                    return {
                        agent: agent.name,
                        domain: agent.domain,
                        message: text,
                        timestamp: `10:4${index} AM`,
                        evidence: Math.random() > 0.8 ? "Final Sign-off Document" : undefined
                    };
                }),
                conclusion: `After 5 rounds, the agents have reached a conclusion. Vote casting initiated.`
            }
        ];

        setDeliberations(prev => ({ ...prev, [proposal.id]: generatedRounds }));
        generateVotes(proposal.id, agents, stances);
    };

    const generateVotes = (proposalId: string, currentAgents: any[], stances: Record<string, 'approve' | 'reject' | 'abstain'>) => {
        const generatedVotes = currentAgents.map(a => {
            const stance = stances[a.domain] || 'abstain';
            let rationale = "";
            switch (stance) {
                case 'approve': rationale = `Approved based on positive impact to ${a.domain} metrics.`; break;
                case 'reject': rationale = `Rejected due to excessive risk/cost in ${a.domain} area.`; break;
                case 'abstain': rationale = `Abstained due to lack of domain overlap or insufficient data.`; break;
            }

            return {
                agent: a.name,
                domain: a.domain,
                vote: stance,
                rationale: rationale,
                confidence: 0.6 + (Math.random() * 0.35)
            };
        });
        setVotes(prev => ({ ...prev, [proposalId]: generatedVotes }));
    };

    const addInfoRequest = (proposalId: string, query: string) => {
        const currentRounds = deliberations[proposalId] || [];
        const nextRoundNum = currentRounds.length + 1;
        const activeParticipants = agents.filter(a => a.active && a.domain !== 'ceo');

        // Generate responses from ALL active participants
        const responses = activeParticipants.map((agent, index) => {
            const templates = [
                `Regarding "${query}": From a ${agent.domain} perspective, this additional context clarifies our position. We have updated our risk assessment accordingly.`,
                `Thanks for the details on "${query}". This helps mitigate some of the ${agent.domain} risks I saw earlier.`,
                `Understood. With the clarification on "${query}", I'm adjusting my confidence score upwards.`,
                `This answer regarding "${query}" addresses my main concerns. I'm ready to proceed.`
            ];
            const msg = templates[Math.floor(Math.random() * templates.length)];

            return {
                agent: agent.name,
                domain: agent.domain,
                message: msg,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isResponse: true
            };
        });

        const userRequestRound: Round = {
            round: nextRoundNum,
            phase: 'Clarification & Re-evaluation',
            conversations: [
                {
                    agent: 'User (Admin)',
                    domain: 'admin',
                    message: `REQUEST FOR INFO: ${query}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isChallenge: true
                },
                ...responses
            ],
            conclusion: `The council has reviewed the additional information regarding "${query}". Proceeding to final vote.`
        };

        setDeliberations(prev => ({ ...prev, [proposalId]: [...currentRounds, userRequestRound] }));

        // Auto-transition to voting after clarification
        setTimeout(() => {
            updateProposalStatus(proposalId, 'voting');
        }, 5000);
    };

    const getDeliberation = (id: string) => {
        return deliberations[id] || [];
    };

    return (
        <ProposalContext.Provider value={{ proposals, deliberations, votes, addProposal, updateProposalStatus, getDeliberation, generateDeliberation, addInfoRequest }}>
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
