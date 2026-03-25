# Infra and Runtime Rules

Runtime controllers must keep clear boundaries between:
- kernel state,
- task orchestration,
- subscriber/event delivery,
- model inference,
- market data ingestion,
- execution adapters,
- UI presentation.

Requirements:
- containerize mutable dependencies,
- pin runtime versions where practical,
- use health checks for local services,
- prefer append-only audit trails,
- version schemas for cross-process messages,
- make crash recovery deterministic.
