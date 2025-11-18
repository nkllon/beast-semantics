# Requirements — GitHub App Governance

- R1: Remove unapproved/proprietary GitHub Apps (e.g., Cursor Bugbot) from `nkllon/beast-semantics` per steering policy.
- R2: Provide a deterministic, non-interactive automation path to uninstall/restrict Apps using approved Chrome automation.
- R3: Do not rely on manual UI steps; encode automation as a repo tool under `tools/automation/`.
- R4: Prefer API/gh where possible; fall back to UI automation only when API lacks capability for our token scope.
- R5: Record actions (who/when/what) to `build/governance/logs/` for auditability.
- R6: Document required secrets/permissions (org/repo admin) and provide a dry-run mode.

