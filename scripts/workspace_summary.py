from pathlib import Path

for path in sorted(Path('.').glob('*')):
    print(path)
