#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 1 ]; then
  echo "Usage: $0 <ttl-file>" >&2
  exit 2
fi
: "${GRAPHDB_URL:?Set GRAPHDB_URL}"
: "${REPO_ID:?Set REPO_ID}"
curl -sS -X POST \
  -H 'Content-Type: text/turtle' \
  --data-binary @"$1" \
  "$GRAPHDB_URL/repositories/$REPO_ID/statements"
echo "Loaded $1 into $REPO_ID"
