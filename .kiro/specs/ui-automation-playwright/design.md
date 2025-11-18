# Design — UI Automation (Playwright)

## Overview
Introduce a repo-scoped Playwright toolkit to perform GitHub UI administration tasks that are not achievable with `gh`/API given available scopes. The toolkit is invoked via a small CLI wrapper and emphasizes determinism, auditability, and safety.

## Architecture
- Runtime: Node.js >= 20
- Libraries: `@playwright/test` (Chromium)
- Location: `tools/automation/playwright/`
- Structure:
  - `package.json` (devDependencies, scripts)
  - `src/cli.ts` (argument parsing, action dispatch)
  - `src/actions/` (modular actions)
    - `uninstallGithubApp.ts`
    - `restrictGithubApp.ts`
    - `removePrSummaryBlock.ts`
  - `src/lib/` (helpers: auth, navigation allowlist, logging, artifacts)
  - `playwright.config.ts`
  - `README.md` (operator docs, secrets, dry-run)
  - Output artifacts: `build/governance/logs/YYYYMMDD-HHMMSS/`

## Execution Model
1) Attempt API-first approach (via `gh api`) when possible.
2) If API route is unavailable/insufficient, perform UI automation:
   - Headless Chromium
   - Navigation allowlist (`https://github.com/settings/*`, repo settings as needed)
   - Explicit selectors using ARIA roles/labels; fallback to data-testid when necessary
3) On failure, capture screenshot, console logs, and network errors to the audit directory.

## Security
- Secrets only via environment variables/CI secrets (e.g., `GITHUB_ADMIN_USER`, `GITHUB_ADMIN_PASS`, `GITHUB_TOTP_SECRET` or session cookie).
- No persistent browser profiles; ephemeral contexts per run.
- Logs redact tokens and PII; artifact retention is configurable.

## Actions (Initial Set)
- uninstallGithubApp: Uninstall a named GitHub App from org/repo scope.
- restrictGithubApp: Move a GitHub App to “Only selected repositories” and remove `nkllon/beast-semantics`.
- removePrSummaryBlock: Remove known PR body blocks (e.g., Cursor Bugbot) using API; UI fallback if editing is locked.

## CLI
`node tools/automation/playwright/dist/cli.js <action> --repo nkllon/beast-semantics --app \"Cursor Bugbot\" [--dry-run]`

## CI Integration (Optional)
- A dedicated `governance.yml` workflow, `workflow_dispatch` only, requiring org/repo admin secrets.
- Not enabled on PRs by default.

## Deployment Modes
- Node (repo-scoped): install `@playwright/test` locally; execute tests/actions via Node. Pros: transparent, version-pinned with repo. Cons: host dependencies (Node, browser downloads) managed by Playwright.
- Docker Desktop MCP: run Playwright as a Docker Desktop MCP (containerized runtime). Pros: stable headless runtime, isolation, consistent artifacts. Cons: requires Docker Desktop + MCP setup and access.

### Mode Selection
- Env var `PLAYWRIGHT_RUNTIME` overrides selection. Accepted values: `node`, `docker-mcp`.
- Auto-detect when unset:
  1) If MCP is installed and reachable, select `docker-mcp`.
  2) Else select `node`.

### Abstraction
- `src/lib/runtime.ts` exposes a unified `runAction(actionName, args)` which delegates to:
  - `src/runtime/node.ts` (spawn `@playwright/test` programmatically)
  - `src/runtime/dockerMcp.ts` (invoke MCP container with bind-mounted workspace and env secrets)

### Artifacts and Logs
- Both modes write to `build/governance/logs/<ts>/` with identical structure (screenshots, traces, console logs).
