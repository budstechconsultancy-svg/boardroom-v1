# BoardRoom Pilot Runbook

## Overview

This runbook covers the deployment and pilot operations for BoardRoom CXO Council in a customer environment.

## Pre-Pilot Checklist

### 1. Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU Cores | 4 | 8 |
| RAM | 16 GB | 32 GB |
| Storage | 100 GB SSD | 500 GB SSD |
| Network | 100 Mbps | 1 Gbps |

### 2. Required Connections

- [ ] ERP access credentials (Tally/Zoho Books)
- [ ] OIDC/SSO provider configured
- [ ] LLM API key (OpenAI/Azure)
- [ ] SMTP for notifications
- [ ] S3-compatible storage

### 3. Security Requirements

- [ ] TLS certificates provisioned
- [ ] Firewall rules configured
- [ ] VPN/private network access
- [ ] Data encryption keys generated

---

## Day 1: Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/boardroom.git
cd boardroom
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with customer-specific values
```

Key configurations:
- `DATABASE_URL` - MySQL connection string
- `LLM_OPENAI_API_KEY` - OpenAI API key
- `AUTH_OIDC_ISSUER` - SSO provider URL
- `TENANT_DEFAULT_CEO_MODE` - Start with "human" for pilot

### Step 3: Start Infrastructure

```bash
docker-compose up -d mysql redis milvus kafka minio
# Wait for services to be healthy
docker-compose ps
```

### Step 4: Initialize Database

```bash
docker-compose exec agent-service alembic upgrade head
```

### Step 5: Start Services

```bash
docker-compose up -d
```

### Step 6: Verify Health

```bash
curl http://localhost:8001/health  # Agent Service
curl http://localhost:8002/health  # Orchestrator
curl http://localhost:8003/health  # Connector
curl http://localhost:8004/health  # Audit
```

---

## Day 2: Connector Setup

### Step 1: Configure ERP Connector

For Tally:
1. Navigate to Admin > Connectors
2. Click "Add Connector"
3. Select "Tally"
4. Enter Tally server URL (default: http://localhost:9000)
5. Enter company name
6. Click "Test Connection"
7. Click "Save"

For Zoho Books:
1. Click "Add Connector"
2. Select "Zoho Books"
3. Complete OAuth2 flow
4. Select organization
5. Click "Save"

### Step 2: Initial Sync

```bash
# Trigger initial full sync
curl -X POST http://localhost:8003/api/v1/connectors/{id}/sync \
  -H "Content-Type: application/json" \
  -d '{"full_sync": true}'
```

### Step 3: Verify Data

1. Check connector status in Admin
2. Verify row counts match ERP
3. Spot-check sample records

---

## Day 3-5: Agent Configuration

### CEO Mode Configuration

Start with **Human Mode** for pilot safety:

```json
{
  "ceo_mode": "human",
  "require_approval_for": ["all"],
  "auto_execute_low_risk": false
}
```

### Agent Activation

1. Activate only relevant agents:
   - HR Agent (if HR data available)
   - Finance Agent (if financial data available)
   - Ops Agent (if inventory data available)

2. Keep others disabled initially

### Test First Proposal

1. Navigate to Proposals > New Proposal
2. Enter test query: "Analyze Q1 budget utilization"
3. Select Finance Agent as proposer
4. Submit and observe deliberation
5. Manually approve test proposal

---

## Week 2: Supervised Operation

### Daily Monitoring

1. Check Dashboard KPIs
2. Review pending proposals
3. Monitor agent accuracy
4. Check connector sync status

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Decision Accuracy | >90% | <80% |
| Auto-Execute Rate | <20% initially | - |
| Human Override Rate | Track | >30% |
| Avg. Decision Time | <10 min | >30 min |

### Escalation Procedures

1. **Agent Error**: Check LLM logs, verify RAG data quality
2. **Connector Failure**: Check ERP connectivity, API limits
3. **Security Alert**: Disable affected connector, notify admin

---

## Week 3-4: Progressive Automation

### Step 1: Enable Low-Risk Auto-Execution

```json
{
  "ceo_mode": "hybrid",
  "auto_execute_low_risk": true,
  "low_risk_threshold_amount": 10000
}
```

### Step 2: Expand Agent Coverage

- Enable additional agents based on data availability
- Configure domain-specific RAG collections

### Step 3: Tune Confidence Thresholds

- Increase `min_confidence_for_auto` based on observed accuracy
- Adjust vote weights based on domain expertise

---

## Rollback Procedures

### Immediate Rollback (Single Action)

1. Navigate to Proposals > [Proposal ID]
2. Click "Rollback"
3. Confirm rollback reason
4. Verify ERP state restored

### Service-Level Rollback

```bash
# Stop services
docker-compose stop

# Restore database from backup
mysql -u root boardroom < backup.sql

# Restart services
docker-compose up -d
```

### Full Rollback

1. Stop all BoardRoom services
2. Restore ERP from pre-pilot backup
3. Document issues encountered
4. Contact support team

---

## Support Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| L1 Support | support@boardroom.ai | Immediate |
| L2 Engineering | engineering@boardroom.ai | 4 hours |
| Emergency | +1-xxx-xxx-xxxx | 24/7 |

---

## Legal Templates

### Data Processing Agreement (DPA)

Located at: `/docs/legal/dpa_template.md`

Key clauses:
- Data processed within tenant's region
- No training on customer data
- 30-day data retention after termination
- SOC 2 Type II compliance

### Enterprise License Agreement

Located at: `/docs/legal/license_template.md`

---

## Appendix: Common Issues

### Issue: Connector Sync Fails

**Symptoms**: Sync stuck, error count increasing

**Resolution**:
1. Check ERP API availability
2. Verify credentials not expired
3. Check rate limits
4. Review connector logs

### Issue: Agent Not Responding

**Symptoms**: Proposal stuck in "deliberating"

**Resolution**:
1. Check LLM API quota
2. Verify RAG service health
3. Check agent service logs
4. Restart agent service if needed

### Issue: High Override Rate

**Symptoms**: Humans rejecting >30% of proposals

**Resolution**:
1. Review rejected proposals for patterns
2. Check evidence quality in RAG
3. Consider retraining agent prompts
4. Adjust confidence thresholds
