# Agent Service

The Agent Service manages CXO domain agents with RAG-powered evidence retrieval and LLM reasoning.

## Features

- Multi-agent runtime with 10 CXO domain agents
- Per-agent RAG pipeline with isolated vector stores
- LLM integration (OpenAI, Azure, custom)
- Agent memory with encrypted persistence
- Proposal generation with evidence references

## Agents

| Agent | Role | Domain |
|-------|------|--------|
| CEO Agent | Chief Executive | Final authority (AI/Human/Hybrid) |
| HR Agent | CHRO | Payroll, hiring, workforce |
| Finance Agent | CFO | Cash flow, budgets, forecasts |
| Ops Agent | COO | Inventory, logistics, production |
| Sales Agent | CRO | Revenue, pricing, deals |
| Procurement Agent | CPO | Vendors, contracts, supply |
| Legal Agent | CLO | Risk, compliance, contracts |
| IT Security Agent | CISO | Access, threats, controls |
| Customer Success Agent | CCO | Retention, satisfaction |
| Product Agent | CPO | Features, roadmap |

## API Endpoints

- `POST /agents` - Create agent
- `GET /agents` - List agents
- `GET /agents/{id}` - Get agent details
- `POST /agents/{id}/propose` - Generate proposal
- `POST /agents/{id}/challenge` - Generate challenge
- `POST /agents/{id}/vote` - Generate vote
