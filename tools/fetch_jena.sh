#!/usr/bin/env bash
set -euo pipefail

# Robust Apache Jena fetch with archive fallback and content validation.
# - Uses JENA_VERSION (default: 4.10.0)
# - Extracts into $PWD/apache-jena-${JENA_VERSION}
# - Appends bin dir to GITHUB_PATH if running in GitHub Actions
#
# Usage:
#   tools/fetch_jena.sh [version]
#   JENA_VERSION=5.0.0 tools/fetch_jena.sh
#

JENA_VERSION="${1:-${JENA_VERSION:-4.10.0}}"
ARCHIVE="apache-jena-${JENA_VERSION}.tar.gz"
OUT_DIR="apache-jena-${JENA_VERSION}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

url_primary="https://downloads.apache.org/jena/binaries/${ARCHIVE}"
url_archive="https://archive.apache.org/dist/jena/binaries/${ARCHIVE}"

echo "Fetching Apache Jena ${JENA_VERSION}..."
echo "Primary: ${url_primary}"
echo "Archive: ${url_archive}"

download_and_check() {
  local url="$1"
  local dst="$2"
  echo "Downloading: $url"
  if ! curl -fsSL "$url" -o "$dst"; then
    echo "Download failed: $url" >&2
    return 1
  fi
  local mime
  mime="$(file -b --mime-type "$dst" || echo "")"
  if [[ "$mime" != "application/gzip" && "$mime" != "application/x-gzip" ]]; then
    echo "Unexpected MIME type for $dst: '$mime' (expected gzip). Showing first 200 bytes for diagnostics:" >&2
    head -c 200 "$dst" || true
    return 1
  fi
  return 0
}

TAR="$TMP_DIR/$ARCHIVE"
if ! download_and_check "$url_primary" "$TAR"; then
  echo "Primary failed. Trying archive..."
  download_and_check "$url_archive" "$TAR"
fi

echo "Extracting $ARCHIVE ..."
tar xzf "$TAR"

if [[ ! -d "$OUT_DIR/bin" ]]; then
  echo "Extraction did not produce expected directory: $OUT_DIR/bin" >&2
  exit 1
fi

echo "Jena extracted to: $PWD/$OUT_DIR"
if [[ -n "${GITHUB_PATH:-}" ]]; then
  echo "$PWD/$OUT_DIR/bin" >> "$GITHUB_PATH"
  echo "Appended $OUT_DIR/bin to GITHUB_PATH"
else
  echo "To use RIOT locally, add to PATH:"
  echo "  export PATH=\"\$PATH:$PWD/$OUT_DIR/bin\""
fi


