#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>"
  exit 2
fi

VERSION="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/build/releases/$VERSION"
MANIFEST="$OUT_DIR/MANIFEST.sha256"
MANIFEST_MD5="$OUT_DIR/MANIFEST.md5"
LABEL_FILE="$OUT_DIR/release.label"

if [ -e "$OUT_DIR" ]; then
  echo "Release directory already exists: $OUT_DIR" >&2
  exit 1
fi

echo "Creating release snapshot: $OUT_DIR"
mkdir -p "$OUT_DIR"

copy_path() {
  local rel="$1"
  local src="$REPO_ROOT/$rel"
  local dst="$OUT_DIR/$rel"
  if [ -e "$src" ]; then
    if [ -d "$src" ]; then
      mkdir -p "$dst"
      rsync -a --delete "$src"/ "$dst"/
    else
      mkdir -p "$(dirname "$dst")"
      cp -p "$src" "$dst"
    fi
  else
    echo "Warning: missing '$rel' (skipped)" >&2
  fi
}

copy_glob_into_build() {
  local pattern="$1"
  shopt -s nullglob
  for f in "$REPO_ROOT"/$pattern; do
    local rel="${f#$REPO_ROOT/}"
    local dst="$OUT_DIR/$rel"
    mkdir -p "$(dirname "$dst")"
    cp -p "$f" "$dst"
  done
  shopt -u nullglob
}

# Snapshot key artifacts
copy_path "AGENTS.md"
copy_path "README.md"
copy_path ".cursor/commands/kiro"
copy_path ".kiro/settings"
copy_path "tools"

echo "Including curated build artifacts ..."
# Curated domain build outputs (if present)
copy_glob_into_build "build/*.ttl"
copy_glob_into_build "build/shacl-*.txt"

echo "Writing human-friendly release label ..."
# Docker-style random tuple (non-security, human-friendly)
adjs=(brisk lucid mellow vivid crisp steady prime noble quiet bold keen bright)
nouns=(otter hawk maple fjord anvil comet atlas delta ember grove harbor mesa)
rand_adj="${adjs[$((RANDOM % ${#adjs[@]}))]}"
rand_noun="${nouns[$((RANDOM % ${#nouns[@]}))]}"
label="$rand_adj-$rand_noun-$RANDOM"
echo "$label" > "$LABEL_FILE"
echo "Label: $(cat "$LABEL_FILE")"

echo "Computing MANIFEST.sha256 and MANIFEST.md5 ..."
: > "$MANIFEST"; : > "$MANIFEST_MD5"
(
  cd "$OUT_DIR"
  # Use shasum -a 256 (macOS) falling back to sha256sum if available
  if command -v shasum >/dev/null 2>&1; then
    find . -type f ! -name "MANIFEST.sha256" -print0 | sort -z | xargs -0 shasum -a 256 | sed 's| ./||' >> "$MANIFEST"
  elif command -v sha256sum >/dev/null 2>&1; then
    find . -type f ! -name "MANIFEST.sha256" -print0 | sort -z | xargs -0 sha256sum | sed 's| \\./||' >> "$MANIFEST"
  else
    echo "No sha256 tool found (shasum or sha256sum required)" >&2
    exit 3
  fi

  # MD5 manifest
  if command -v md5 >/dev/null 2>&1; then
    # macOS md5 outputs: MD5 (file) = hash OR with -r: hash file
    while IFS= read -r -d '' f; do
      h="$(md5 -r "$f" | awk '{print $1}')"
      rel="${f#./}"
      echo "$h  $rel" >> "$MANIFEST_MD5"
    done < <(find . -type f ! -name "MANIFEST.md5" -print0 | sort -z)
  elif command -v md5sum >/dev/null 2>&1; then
    find . -type f ! -name "MANIFEST.md5" -print0 | sort -z | xargs -0 md5sum | sed 's| \\./||' >> "$MANIFEST_MD5"
  else
    echo "No md5 tool found (md5 or md5sum). Skipping MANIFEST.md5" >&2
    rm -f "$MANIFEST_MD5"
  fi
)

COUNT="$(wc -l < "$MANIFEST" | tr -d ' ')"
echo "Release snapshot created with $COUNT file(s)."
echo "SHA-256 Manifest: $MANIFEST"
if [ -f "$MANIFEST_MD5" ]; then
  echo "MD5 Manifest: $MANIFEST_MD5"
fi

echo "Generating SBOM (best-effort) ..."
SBOM_PATH="$OUT_DIR/sbom.cdx.json"
if tools/generate-sbom.sh "$SBOM_PATH"; then
  echo "SBOM generated at: $SBOM_PATH"
else
  echo "SBOM generation skipped (tool not available)."
fi


