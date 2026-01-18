import sys
from pathlib import Path
from rdflib import Graph

FAIL = False
for path in sorted(Path('.').rglob('*.ttl')):
    try:
        Graph().parse(str(path), format='turtle')
        print(f"OK: {path}")
    except Exception as e:
        print(f"ERR: {path}: {e}", file=sys.stderr)
        FAIL = True

sys.exit(1 if FAIL else 0)
