# Orchestrator Service

The Orchestrator Service implements the board deliberation workflow:

**propose → challenge → counterproposal → vote**

## Workflow

1. **Proposal Phase**: Agent submits proposal with evidence
2. **Challenge Phase**: Other agents review and raise challenges
3. **Counter-Proposal Phase**: Agents can submit counter-proposals
4. **Voting Phase**: All agents vote with weighted scores
5. **Decision**: CEO/Board makes final decision

## Configuration

- `max_rounds`: Maximum deliberation rounds (default: 3)
- `round_timeout`: Timeout per round in seconds
- `quorum_percentage`: Minimum votes required
- `ceo_mode`: ai | human | hybrid

## API Endpoints

- `POST /deliberation/start` - Start deliberation
- `GET /deliberation/{id}` - Get deliberation status
- `POST /deliberation/{id}/rounds` - Advance round
- `POST /deliberation/{id}/vote` - Submit vote
- `GET /deliberation/{id}/result` - Get final result
