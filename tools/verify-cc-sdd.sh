#!/usr/bin/env bash
set -euo pipefail

error_count=0

fail() {
  echo "ERROR: $1"
  error_count=$((error_count+1))
}

echo "== CC-SDD (Kiro) setup verification =="

# Node.js check
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js not found. Node 18+ is required."
else
  ver="$(node -v | sed 's/^v//')"
  major="${ver%%.*}"
  if [[ "$major" =~ ^[0-9]+$ ]] && [ "$major" -ge 18 ]; then
    echo "OK: Node.js version $ver"
  else
    fail "Node.js 18+ required. Current: $ver"
  fi
fi

# Commands check
commands_dir=".cursor/commands/kiro"
expected_commands=(
  "spec-design.md"
  "spec-impl.md"
  "spec-init.md"
  "spec-requirements.md"
  "spec-status.md"
  "spec-tasks.md"
  "steering-custom.md"
  "steering.md"
  "validate-design.md"
  "validate-gap.md"
  "validate-impl.md"
)

if [ ! -d "$commands_dir" ]; then
  fail "Missing directory: $commands_dir"
else
  missing=()
  for f in "${expected_commands[@]}"; do
    [ -f "$commands_dir/$f" ] || missing+=("$f")
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    fail "Missing command files: ${missing[*]}"
  else
    count="$(ls -1 "$commands_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')"
    if [ "$count" -ne 11 ]; then
      fail "Expected 11 command files in $commands_dir, found $count"
    else
      echo "OK: Kiro commands present (11)"
    fi
  fi
fi

# Settings check
settings_dir=".kiro/settings"
for d in "rules" "templates/specs" "templates/steering" "templates/steering-custom"; do
  if [ ! -d "$settings_dir/$d" ]; then
    fail "Missing directory: $settings_dir/$d"
  else
    echo "OK: $settings_dir/$d"
  fi
done

# AGENTS.md presence
if [ ! -f "AGENTS.md" ]; then
  fail "Missing file: AGENTS.md"
else
  echo "OK: AGENTS.md present"
fi

if [ "$error_count" -gt 0 ]; then
  echo "== Verification FAILED ($error_count issue(s)) =="
  exit 1
else
  echo "== Verification PASSED =="
  exit 0
fi


