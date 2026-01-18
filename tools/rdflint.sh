#!/usr/bin/env bash
set -euo pipefail

# rdflint runner (CI/local). Skips gracefully if not configured.
# Usage: tools/rdflint.sh
#
# Configuration (any one):
# - RDFLINT_JAR=/absolute/path/to/rdflint-all.jar
# - Place rdflint-all.jar under tools/vendor/rdflint/rdflint-all.jar

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAR="${RDFLINT_JAR:-}"
if [[ -z "${JAR}" ]]; then
	if [[ -f "${ROOT_DIR}/tools/vendor/rdflint/rdflint-all.jar" ]]; then
		JAR="${ROOT_DIR}/tools/vendor/rdflint/rdflint-all.jar"
	fi
fi

if [[ -z "${JAR}" || ! -f "${JAR}" ]]; then
	echo "rdflint skipped: JAR not configured (set RDFLINT_JAR or place under tools/vendor/rdflint/rdflint-all.jar)"
	exit 0
fi

TARGET_DIRS=(
	"ontology"
	"shapes"
	"mappings"
	"build"
)

found_any=false
inputs=()
for d in "${TARGET_DIRS[@]}"; do
	if [[ -d "${ROOT_DIR}/${d}" ]]; then
		mapfile -t files < <(find "${ROOT_DIR}/${d}" -type f \( -name "*.ttl" -o -name "*.trig" -o -name "*.nt" -o -name "*.nq" \))
		if [[ "${#files[@]}" -gt 0 ]]; then
			found_any=true
			inputs+=("${files[@]}")
		fi
	fi
done

if [[ "${found_any}" != "true" ]]; then
	echo "rdflint: No RDF files found; skipping."
	exit 0
fi

set +e
java -jar "${JAR}" "${inputs[@]}"
code=$?
set -e

if [[ $code -ne 0 ]]; then
	echo "rdflint: Validation FAILED (exit ${code})"
	exit $code
fi
echo "rdflint: Validation PASSED"
exit 0


