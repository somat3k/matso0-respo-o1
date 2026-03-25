# Copilot Instructions

Treat this repository as a controlled financial systems project.

Priorities:
1. preserve correctness over speed,
2. isolate strategy logic from execution logic,
3. keep deterministic config paths,
4. write explicit interfaces for chains, exchanges, model loaders, and agents,
5. never hardcode secrets, private keys, or production endpoints.

Required practices:
- prefer small, reviewable changes,
- add docs when introducing runtime, controller, storage, or agent behavior,
- keep Rust modules cohesive and typed,
- keep Python sidecars optional and well-bounded,
- label placeholders clearly.
