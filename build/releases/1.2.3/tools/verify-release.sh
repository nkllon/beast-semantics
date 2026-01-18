#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>"
  exit 2
fi

VERSION="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SNAP_DIR="$REPO_ROOT/build/releases/$VERSION"
MANIFEST="$SNAP_DIR/MANIFEST.sha256"
MANIFEST_MD5="$SNAP_DIR/MANIFEST.md5"

if [ ! -d "$SNAP_DIR" ]; then
  echo "Missing release directory: $SNAP_DIR" >&2
  exit 1
fi
if [ ! -f "$MANIFEST" ]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

err=0
echo "Verifying release snapshot: $SNAP_DIR"
echo "1/2: Verifying SHA-256 manifest"
while IFS= read -r line; do
  # Expect lines like: "<hash>  relative/path"
  digest="$(echo "$line" | awk '{print $1}')"
  relpath="$(echo "$line" | awk '{print $2}')"
  file="$SNAP_DIR/$relpath"
  if [ ! -f "$file" ]; then
    echo "MISSING: $relpath"
    err=$((err+1))
    continue
  fi
  if command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  else
    actual="$(sha256sum "$file" | awk '{print $1}')"
  fi
  if [ "$actual" != "$digest" ]; then
    echo "MISMATCH: $relpath"
    echo "  Expected: $digest"
    echo "  Actual:   $actual"
    err=$((err+1))
  fi
done < "$MANIFEST"

if [ -f "$MANIFEST_MD5" ]; then
  echo "2/2: Verifying MD5 manifest"
  while IFS= read -r line; do
    digest="$(echo "$line" | awk '{print $1}')"
    relpath="$(echo "$line" | awk '{print $2}')"
    file="$SNAP_DIR/$relpath"
    if [ ! -f "$file" ]; then
      echo "MISSING: $relpath"
      err=$((err+1))
      continue
    fi
    if command -v md5 >/dev/null 2>&1; then
      actual="$(md5 -r "$file" | awk '{print $1}')"
    else
      actual="$(md5sum "$file" | awk '{print $1}')"
    fi
    if [ "$actual" != "$digest" ]; then
      echo "MISMATCH (MD5): $relpath"
      echo "  Expected: $digest"
      echo "  Actual:   $actual"
      err=$((err+1))
    fi
  done < "$MANIFEST_MD5"
else
  echo "MD5 manifest not found (skipping MD5 verification)"
fi

if [ "$err" -gt 0 ]; then
  echo "Verification FAILED ($err issue(s))"
  exit 1
else
  echo "Verification PASSED"
  exit 0
fi


