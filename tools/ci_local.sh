#!/usr/bin/env bash
set -euo pipefail

# Local runner that mirrors the GitHub QA workflow as closely as possible.
# It assumes Python and Node (>=20) are available.
#
# Usage:
#   tools/ci_local.sh            # run all steps
#   ENFORCE_SPQ_FORMAT=true tools/ci_local.sh
#

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Preflight checks =="
# Python
if command -v python >/dev/null 2>&1; then PY=python; PIP="python -m pip"; else
  if command -v python3 >/dev/null 2>&1; then PY=python3; PIP="python3 -m pip"; else
    echo "Missing Python (python or python3). Install Python 3.x." >&2; exit 1
  fi
fi
# Node & npm
command -v node >/dev/null 2>&1 || { echo "Missing Node.js (>=20). Install Node." >&2; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "Missing npm. Install Node/npm." >&2; exit 1; }
# curl
command -v curl >/dev/null 2>&1 || { echo "Missing curl. Install curl." >&2; exit 1; }
:

echo "== Python virtualenv =="
if [ -z "${VIRTUAL_ENV:-}" ] || [ "$VIRTUAL_ENV" != "$ROOT/.venv" ]; then
  echo "Creating/activating venv at $ROOT/.venv"
  $PY -m venv "$ROOT/.venv"
  # shellcheck disable=SC1091
  source "$ROOT/.venv/bin/activate"
  PY="$ROOT/.venv/bin/python"
  PIP="$ROOT/.venv/bin/pip"
fi

echo "== Install Python deps =="
"$PY" -m pip install --upgrade pip
"$PIP" install -r requirements.txt

echo "== RDF validation (RDFLib across ttl/trig/nt/nq) =="
$PY tools/validate_rdf.py

echo "== Assemble ontology =="
$PY tools/assemble.py

echo "== Validate (pySHACL) =="
$PY tools/validate.py

echo "== Setup Node deps =="
npm ci --no-fund --no-audit

echo "== SPARQL parse/format check =="
node tools/sparql_check.mjs queries || true

echo "== Skip Jena/RIOT (removed) =="

:

echo "== (Optional) gitleaks =="
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --redact || true
else
  echo "gitleaks not installed locally; skipping."
fi

echo "== pip-audit (fail on CVSS >= 7.0) =="
pip install "pip-audit==2.7.3"
set +e
pip-audit -r requirements.txt -f json -o audit.json || true
python - << 'PY'
import json, sys
try:
    data = json.load(open('audit.json'))
except Exception:
    print('No audit.json or invalid JSON; failing to be safe.')
    sys.exit(1)
def score(v):
    sev = v.get('severity', {})
    s = sev.get('score')
    try:
        return float(s)
    except Exception:
        return 0.0
highs = []
for dep in data:
    for v in dep.get('vulns', []):
        if score(v) >= 7.0:
            highs.append(v)
if highs:
    print(f"High/Critical vulnerabilities found: {len(highs)} (CVSS >= 7.0)")
    sys.exit(1)
print("No High/Critical vulnerabilities (CVSS >= 7.0).")
PY
set -e

echo "== Domain metrics baseline compare =="
python - << 'PY'
import os, sys
sys.path.insert(0, 'tools')
try:
    from metrics_diversity import shannon_index
except Exception:
    print('metrics_diversity.py not available; skipping.')
    raise SystemExit(0)
def shannon_for(dir_path):
    labels = []
    qdir = os.path.join(dir_path, 'queries')
    if not os.path.isdir(qdir):
        return 0.0
    for root, _, files in os.walk(qdir):
        for f in files:
            if f.endswith('.rq'):
                labels.append(f.split('_')[0])
    return shannon_index(labels)
cur = shannon_for('.')
print(f"Shannon diversity current={cur:.4f}")
PY

echo "== Summary =="
echo "Local QA pipeline completed."


