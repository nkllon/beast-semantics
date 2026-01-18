#!/usr/bin/env bash
set -euo pipefail

# Verify an immutable release snapshot by checking MANIFEST.sha256 (and optionally MANIFEST.md5)
# Usage: tools/verify-release.sh <version>
#
# Verifies:
# - build/releases/<version>/ exists
# - MANIFEST.sha256 exists and matches all files' SHA-256 checksums
# - MANIFEST.md5 (if present) matches all files' MD5 checksums
# - No missing files listed in manifests
#
# Exits:
# - 0 on success
# - 1 on any checksum mismatch or missing file
# - 2 on usage error

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>" >&2
  exit 2
fi

VERSION="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SNAPSHOT_DIR="$REPO_ROOT/build/releases/$VERSION"
MANIFEST_SHA="$SNAPSHOT_DIR/MANIFEST.sha256"
MANIFEST_MD5="$SNAPSHOT_DIR/MANIFEST.md5"

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "ERROR: Snapshot directory not found: $SNAPSHOT_DIR" >&2
  exit 1
fi

if [ ! -f "$MANIFEST_SHA" ]; then
  echo "ERROR: Missing manifest: $MANIFEST_SHA" >&2
  exit 1
fi

echo "== Verifying release snapshot: $SNAPSHOT_DIR =="
echo "Using: $MANIFEST_SHA"

error_count=0

verify_sha256_line() {
  local expected_hash="$1"
  local rel_path="$2"
  local abs_path="$SNAPSHOT_DIR/$rel_path"

  if [ ! -f "$abs_path" ]; then
    echo "SHA256 MISSING: $rel_path"
    error_count=$((error_count+1))
    return
  fi

  local actual_hash=""
  # Prefer shasum -a 256 (macOS) else fallback to sha256sum
  if command -v shasum >/dev/null 2>&1; then
    actual_hash="$(shasum -a 256 "$abs_path" | awk '{print $1}')"
  elif command -v sha256sum >/dev/null 2>&1; then
    actual_hash="$(sha256sum "$abs_path" | awk '{print $1}')"
  else
    echo "ERROR: No sha256 tool available (shasum or sha256sum required)" >&2
    exit 1
  fi

  if [ "$actual_hash" != "$expected_hash" ]; then
    echo "SHA256 MISMATCH: $rel_path"
    echo "  expected: $expected_hash"
    echo "  actual:   $actual_hash"
    error_count=$((error_count+1))
  fi
}

verify_md5_line() {
  local expected_hash="$1"
  local rel_path="$2"
  local abs_path="$SNAPSHOT_DIR/$rel_path"

  if [ ! -f "$abs_path" ]; then
    echo "MD5 MISSING: $rel_path"
    error_count=$((error_count+1))
    return
  fi

  local actual_hash=""
  if command -v md5 >/dev/null 2>&1; then
    actual_hash="$(md5 -r "$abs_path" | awk '{print $1}')"
  elif command -v md5sum >/dev/null 2>&1; then
    actual_hash="$(md5sum "$abs_path" | awk '{print $1}')"
  else
    echo "NOTE: No md5 tool found; skipping MD5 verification for $rel_path"
    return
  fi

  if [ "$actual_hash" != "$expected_hash" ]; then
    echo "MD5 MISMATCH: $rel_path"
    echo "  expected: $expected_hash"
    echo "  actual:   $actual_hash"
    error_count=$((error_count+1))
  fi
}

# Verify SHA-256 manifest
while IFS= read -r line; do
  # Lines in MANIFEST.sha256 look like: "<hash>  <path>"
  # Accept one or more spaces between hash and path.
  hash_part="$(echo "$line" | awk '{print $1}')"
  path_part="$(echo "$line" | sed -E 's/^[a-fA-F0-9]+[[:space:]]+//')"
  # Skip empty lines just in case
  [ -z "${hash_part:-}" ] && continue
  [ -z "${path_part:-}" ] && continue
  verify_sha256_line "$hash_part" "$path_part"
done < "$MANIFEST_SHA"

# Verify MD5 manifest if present
if [ -f "$MANIFEST_MD5" ]; then
  echo "Using: $MANIFEST_MD5"
  while IFS= read -r line; do
    # Lines in MANIFEST.md5 look like: "<hash>  <path>"
    hash_part="$(echo "$line" | awk '{print $1}')"
    path_part="$(echo "$line" | sed -E 's/^[a-fA-F0-9]+[[:space:]]+//')"
    [ -z "${hash_part:-}" ] && continue
    [ -z "${path_part:-}" ] && continue
    verify_md5_line "$hash_part" "$path_part"
  done < "$MANIFEST_MD5"
fi

if [ "$error_count" -gt 0 ]; then
  echo "== Release verification FAILED ($error_count issue(s)) =="
  exit 1
else
  echo "== Release verification PASSED =="
  exit 0
fi

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


