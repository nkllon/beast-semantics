# Requirements — UI Automation (Playwright)

- R1: Approve Playwright as the standard UI automation tool for admin-only GitHub web tasks when `gh`/API cannot satisfy the requirement.
- R2: Tool availability: Node.js >= 20; local, repo-scoped installation of `@playwright/test` (Chromium only by default). No global installs.
- R3: Security: do not persist credentials; use environment variables or CI secrets. Mask secrets in logs; never commit tokens or cookies.
- R4: Determinism: prefer `gh`/REST/GraphQL APIs first; fall back to Playwright only for gaps that cannot be closed with available scopes.
- R5: Non-interactive execution: support headless mode, with optional screenshot/video capture on failure.
- R6: Auditability: write redacted audit logs and artifacts to `build/governance/logs/` with timestamps.
- R7: Idempotency: actions (e.g., uninstall/restrict a GitHub App) must be safe to re-run.
- R8: Operational surface: support local CLI and a gated CI workflow (`workflow_dispatch`) that requires explicit secrets and approvers.
- R9: Scope control: restrict browser navigation allowlist to `github.com` settings and related subpaths required for the action.
- R10: Extensibility: provide an action registry for common governance tasks (e.g., uninstall GitHub App, restrict GitHub App to selected repos, remove PR summary blocks).
- R11: Documentation: include operator instructions, secrets configuration, and dry-run mode behavior.

## Deployment Options (Evaluation Required)
- R12: Evaluate Docker Desktop MCP-based Playwright as an alternative runtime. If present and approved, support it as a first-class execution mode.
- R13: Selection criteria: determinism, headless reliability on macOS, secrets handling, artifact capture parity, CI parity, and ease of operator use.
- R14: Auto-detection: prefer a configurable selector (env var `PLAYWRIGHT_RUNTIME={node|docker-mcp}`) with sensible auto-detect defaults (use MCP when available and approved).
- R15: Fallback: if MCP is unavailable/unapproved, fall back to repo-scoped Node install (`@playwright/test`) without global installs.

