#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <output-path>"
  echo "Example: $0 build/releases/1.2.3/sbom.cdx.json"
  exit 2
fi

OUT="$1"
OUT_DIR="$(dirname "$OUT")"
mkdir -p "$OUT_DIR"

# Prefer cyclonedx-bom if available
# Prefer cyclonedx tools if available
if command -v cyclonedx-py >/dev/null 2>&1; then
  if [ -f "requirements.txt" ]; then
    echo "Generating CycloneDX SBOM from requirements.txt using cyclonedx-py ..."
    cyclonedx-py requirements requirements.txt --of JSON -o "$OUT" --output-reproducible
    echo "SBOM written to: $OUT"
    exit 0
  fi
fi
if command -v cyclonedx-bom >/dev/null 2>&1; then
  if [ -f "requirements.txt" ]; then
    echo "Generating CycloneDX SBOM from requirements.txt using cyclonedx-bom ..."
    cyclonedx-bom -o "$OUT" -e -r requirements.txt
    echo "SBOM written to: $OUT"
    exit 0
  fi
fi

# Try syft if available
if command -v syft >/dev/null 2>&1; then
  echo "Generating CycloneDX SBOM from repository directory using syft ..."
  syft dir:. -o cyclonedx-json > "$OUT"
  echo "SBOM written to: $OUT"
  exit 0
fi

echo "No SBOM tool found (cyclonedx-bom or syft)."
echo "Install one of:"
echo "  pipx install cyclonedx-bom"
echo "  brew install anchore/syft/syft"
exit 3


