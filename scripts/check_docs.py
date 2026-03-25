from pathlib import Path

required = [
    "docs/00-project-vademecum.md",
    "docs/01-system-processes.md",
    "docs/15-blockchain-addresses-and-token-registry.md",
]

missing = [p for p in required if not Path(p).exists()]
if missing:
    raise SystemExit("Missing docs: " + ", ".join(missing))
print("docs check passed")
