# Financial Safety Rules

This repository may support research, analytics, backtesting, and execution tooling for digital assets.

Controls:
- default all environments to simulation mode,
- require explicit environment flags for live execution,
- require human approval for any action that can move funds,
- keep policy checks separate from strategy generation,
- log order intent, validation result, and execution result independently,
- define maximum exposure, loss, and rate limits in config, not code,
- never commit credentials, seed phrases, or signing material.
