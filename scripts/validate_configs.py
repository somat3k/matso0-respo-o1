import json
from pathlib import Path

paths = list(Path("configs").glob("*.json"))
for path in paths:
    with path.open() as f:
        json.load(f)
print(f"validated {len(paths)} config files")
