# Production analysis

Use for production mode and whenever the topic has material operational consequences. Select dimensions based on the system; do not append a generic production checklist.

- **Architecture:** service/module boundaries, ownership, sync/async communication, state location, and full data flow.
- **Scalability:** bottlenecks, concurrency, vertical/horizontal options, load distribution, shared state, and new coordination/failure modes.
- **Reliability:** failure scenarios, deadlines/timeouts, retry/backoff safety, idempotency, degradation, recovery, and data repair.
- **Security:** assets/trust boundaries, authentication/authorization, validation, secrets, isolation, least privilege, abuse, and supply chain.
- **Observability:** actionable logs, metrics, traces, SLOs, alerts, correlation, and incident questions.
- **Performance:** latency/throughput budgets, memory/CPU/network/storage costs, contention, caching, and measurement method.
- **Cost:** dominant resource and operational costs, scaling curve, managed/self-hosted trade-offs, and optimization consequences.
- **Deployment:** runtime/container/infrastructure, configuration, health/readiness, rollout/rollback, migrations, and CI/CD.
- **Testing:** unit, integration, contract, end-to-end, load, fault, security, and recovery tests appropriate to the mechanism.

For every included dimension, connect the recommendation to a concrete component and constraint. Explain what can be replicated, where state lives, and what failure conditions the choice introduces. Distinguish sourced practice from an engineering proposal.
