# BoardRoom - CXO Council Web Application

> **Multi-Agent Deliberative Decision Engine for Enterprise ERPs**

BoardRoom converts ERP data into auditable, evidence-backed executive decisions by running domain agents (HR, Finance, Ops, Sales, Procurement, Legal, IT Security, Customer Success, Product) through a structured **propose → challenge → counterproposal → vote** workflow.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                    React + TypeScript + Ant Design                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                  │
│                          FastAPI                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐  ┌───────────────────────────┐  ┌───────────────────┐
│ Agent Service │  │ Orchestrator Service      │  │ Connector Service │
│  (CXO Agents) │  │ (Board Deliberation)      │  │ (ERP Adapters)    │
└───────────────┘  └───────────────────────────┘  └───────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐  ┌───────────────────────────┐  ┌───────────────────┐
│ Audit Service │  │ Auth Service              │  │ Admin Service     │
│ (Ledger/PDF)  │  │ (OIDC/RBAC)               │  │ (Tenants/Config)  │
└───────────────┘  └───────────────────────────┘  └───────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MySQL │ Redis │ Milvus (Vector DB) │ S3 Storage │ Kafka/RabbitMQ  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent System

### Domain Agents (Virtual CXOs)
| Agent | Role | Capabilities |
|-------|------|--------------|
| HR Agent | CHRO | Payroll, hiring, workforce decisions |
| Finance Agent | CFO | Cash flow, budgets, forecasts |
| Ops Agent | COO | Inventory, logistics, production |
| Sales Agent | CRO | Revenue, pricing, deals |
| Procurement Agent | CPO | Vendor contracts, supply |
| Legal Agent | CLO | Risk, contracts, regulations |
| IT Security Agent | CISO | Access, threats, controls |
| Customer Success Agent | CCO | Retention, satisfaction |
| Product Agent | CPO | Features, roadmap, innovation |
| **CEO Agent** | CEO | Final authority (AI/Human/Hybrid) |

### Deliberation Workflow
```
1. PROPOSE    → Agents submit proposals with evidence
2. CHALLENGE  → Agents challenge others' proposals
3. COUNTER    → Agents submit counter-proposals
4. VOTE       → Weighted voting by domain expertise
5. EXECUTE    → CEO approves, action executed with rollback
```

---

## 📂 Project Structure

```
boardroom/
├── backend/
│   ├── shared/              # Shared models, config, utils
│   ├── agent-service/       # CXO Agent runtime + RAG
│   ├── orchestrator-service/# Board deliberation engine
│   ├── connector-service/   # Multi-ERP connectors
│   ├── audit-service/       # Audit ledger + PDF
│   ├── auth-service/        # OIDC/OAuth2 + RBAC
│   ├── admin-service/       # Tenant management
│   ├── billing-service/     # Usage metering
│   └── pdf-service/         # PDF generation
├── frontend/                # React + TypeScript + Ant Design
├── infra/
│   ├── helm/               # Kubernetes Helm charts
│   └── k8s/                # Kubernetes manifests
├── docs/
│   ├── api/                # OpenAPI + Postman
│   ├── runbooks/           # Operational runbooks
│   └── legal/              # DPA, contracts
├── tests/                  # Unit, integration, E2E tests
├── docker-compose.yml      # Local development
└── .github/workflows/      # CI/CD pipelines
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/boardroom.git
cd boardroom

# Copy environment file
cp .env.example .env

# Start infrastructure
docker-compose up -d mysql redis milvus kafka minio

# Start backend services
cd backend/agent-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8001

# Start frontend
cd frontend && npm install && npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔐 Security Features

- ✅ OIDC/OAuth2 SSO authentication
- ✅ RBAC with roles: Owner, CXO, Approver, Auditor, Integrator, Admin
- ✅ TLS everywhere
- ✅ Field-level encryption for PII
- ✅ KMS integration
- ✅ Append-only audit ledger with cryptographic hashes
- ✅ PII masking in UI
- ✅ Raw LLM prompt logging (Auditor access only)

---

## 📊 Supported ERPs

| ERP | Status |
|-----|--------|
| Tally | ✅ Production |
| Zoho Books | ✅ Production |
| SAP Business One | 🔧 Scaffold |
| NetSuite | 🔧 Scaffold |
| Oracle ERP | 🔧 Scaffold |
| Microsoft Dynamics | 🔧 Scaffold |
| QuickBooks | 🔧 Scaffold |
| Custom (SDK) | 🔧 Template |

---

## 📖 Documentation

- [API Documentation](docs/api/openapi.yaml)
- [Postman Collection](docs/api/postman/)
- [Pilot Runbook](docs/runbooks/pilot-runbook.md)
- [Architecture Guide](docs/architecture.md)

---

## 📄 License

Copyright © 2024 BoardRoom. All rights reserved.
