import os
import sys
import pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]

GRAPHDB_URL = os.environ.get("GRAPHDB_URL")  # e.g., http://localhost:7200
REPO_ID = os.environ.get("REPO_ID")

if not GRAPHDB_URL or not REPO_ID:
    print("Set GRAPHDB_URL and REPO_ID env vars", file=sys.stderr)
    sys.exit(2)

if len(sys.argv) < 2:
    print("Usage: python3 tools/load_graphdb.py <ttl-file>", file=sys.stderr)
    sys.exit(2)

ttl_path = pathlib.Path(sys.argv[1])
if not ttl_path.exists():
    print(f"Not found: {ttl_path}", file=sys.stderr)
    sys.exit(2)

endpoint = f"{GRAPHDB_URL.rstrip('/')}/repositories/{REPO_ID}/statements"
headers = {"Content-Type": "text/turtle"}
with open(ttl_path, "rb") as fh:
    resp = requests.post(endpoint, data=fh.read(), headers=headers)
    resp.raise_for_status()
print(f"Loaded into {REPO_ID}: {ttl_path}")
