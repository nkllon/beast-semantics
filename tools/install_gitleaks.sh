#!/usr/bin/env bash
set -euo pipefail

# Install gitleaks into tools/bin without requiring system package managers.
# Tries Homebrew on macOS first, then falls back to GitHub releases binary.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$ROOT/tools/bin"
mkdir -p "$BIN_DIR"

if command -v gitleaks >/dev/null 2>&1; then
  exit 0
fi

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

# Normalize arch
case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
esac

# Try Homebrew on macOS, if available
if [ "$OS" = "darwin" ] && command -v brew >/dev/null 2>&1; then
  brew install gitleaks && exit 0 || true
fi

# Fallback to GitHub Releases: latest tag
LATEST_URL="https://api.github.com/repos/gitleaks/gitleaks/releases/latest"
if command -v curl >/dev/null 2>&1; then
  TAG="$(curl -fsSL "$LATEST_URL" | sed -n 's/.*\"tag_name\": *\"\\([^\"]*\\)\".*/\\1/p' | head -n1)"
else
  echo "curl is required to fetch gitleaks release info" >&2
  exit 1
fi

if [ -z "${TAG:-}" ]; then
  echo "Unable to resolve latest gitleaks tag from GitHub API" >&2
  exit 1
fi

ASSET_OS=""
case "$OS" in
  darwin) ASSET_OS="darwin" ;;
  linux) ASSET_OS="linux" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

ARCH_MAP="$ARCH"
case "$ARCH" in
  x64) ARCH_MAP="x64" ;;
  arm64) ARCH_MAP="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

TARBALL="gitleaks_${TAG#v}_${ASSET_OS}_${ARCH_MAP}.tar.gz"
DL_URL="https://github.com/gitleaks/gitleaks/releases/download/${TAG}/${TARBALL}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading gitleaks $TAG ($ASSET_OS/$ARCH_MAP)..."
curl -fsSL -o "$TMP_DIR/$TARBALL" "$DL_URL"
tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR"
if [ ! -f "$TMP_DIR/gitleaks" ]; then
  # some releases unpack into subdir
  BIN_PATH="$(find "$TMP_DIR" -type f -name gitleaks | head -n1 || true)"
else
  BIN_PATH="$TMP_DIR/gitleaks"
fi
if [ -z "${BIN_PATH:-}" ] || [ ! -f "$BIN_PATH" ]; then
  echo "Failed to locate gitleaks binary in the archive" >&2
  exit 1
fi
install -m 0755 "$BIN_PATH" "$BIN_DIR/gitleaks"
echo "Installed gitleaks to $BIN_DIR/gitleaks"
echo "Add to PATH or export: PATH=\"$BIN_DIR:\$PATH\""


