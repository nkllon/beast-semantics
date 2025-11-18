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

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation allowlist enforcement
*For any* action execution, all browser navigation attempts should only succeed for URLs matching the allowlist pattern (`github.com/settings/*` and approved subpaths).
**Validates: Requirements 9.1, 9.2**

### Property 2: Audit log completeness
*For any* action executed (not in dry-run mode), an audit log file should be created in `build/governance/logs/` with all required fields (timestamp, action, target, outcome) populated.
**Validates: Requirements 6.1, 6.2, 6.4**

### Property 3: Secret redaction
*For any* audit log or console output, no environment variables matching secret patterns (TOKEN, PASSWORD, SECRET, KEY) should appear in plaintext.
**Validates: Requirements 3.2, 6.3**

### Property 4: Idempotency
*For any* action executed twice with the same parameters, both executions should succeed and produce the same final state (verified by comparing GitHub state before first run and after second run).
**Validates: Requirements 7.1, 7.2**

### Property 5: API-first preference
*For any* action where both API and UI methods are implemented, the system should attempt the API method before attempting UI automation (verified by checking execution logs).
**Validates: Requirements 4.1, 4.2**

### Property 6: Dry-run safety
*For any* action executed with `--dry-run` flag, no changes should be made to actual GitHub state (verified by comparing before/after state).
**Validates: Requirements 11.3**

## Testing Strategy

### Unit Testing
- **Action modules**: Test each action's logic independently
- **Navigation guard**: Test allowlist enforcement with various URLs
- **Audit logger**: Test log format and redaction
- **Runtime selector**: Test auto-detection logic

### Property-Based Testing
- **Property 1 (Navigation allowlist)**: Generate random URLs, verify only allowlisted ones succeed
- **Property 2 (Audit completeness)**: Generate random actions, verify audit logs created with all fields
- **Property 3 (Secret redaction)**: Generate random secret values, verify they're redacted in output
- **Property 4 (Idempotency)**: Run same action twice, verify identical end state
- **Property 5 (API-first)**: Mock both API and UI available, verify API attempted first
- **Property 6 (Dry-run safety)**: Run actions with --dry-run, verify no state changes

### Integration Testing
- **End-to-end**: Test complete action flow from CLI to audit log
- **MCP runtime**: Test both Node and Docker MCP execution modes
- **Failure scenarios**: Test screenshot/video capture on failures
- **CI workflow**: Test workflow_dispatch integration

### Manual Testing
- **Real GitHub operations**: Test on sandbox repository
- **Permission verification**: Test with various GitHub permission levels
- **Documentation**: Follow operator docs to perform common tasks
