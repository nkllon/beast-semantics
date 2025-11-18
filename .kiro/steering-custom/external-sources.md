# External Sources Registry

Purpose: Declare approved external directories/repos that agents may read/scan. This is the single source of truth for external paths. If a path needed for work is not listed here, agents must fail fast and request that it be added (requirements-first).

How to use:
- Add absolute paths only (no ~, no env vars).
- For each entry, specify purpose, allowed operations, and verification commands.
- Once recorded here, agents must not ask again for the same path.

Entries (add below):

- name: Fort desktop projects
  path: ${FORT_DESKTOP}
  purpose: Source of existing automation/governance implementations to be reused.
  allowed_operations: [read]
  verification: [ "ls -la \"$FORT_DESKTOP\"", "test -d \"$FORT_DESKTOP\"" ]
  notes: |
    - Set FORT_DESKTOP per host (e.g., /Volumes/lemon/cursor/fort). Environment variable takes precedence.
    - If FORT_DESKTOP is unset, provide the absolute path once; record it here for reuse.


