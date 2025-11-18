# Tasks — UI Automation (Playwright)

1. Scaffold automation package
   - Create `tools/automation/playwright/` with `package.json`, `tsconfig.json`, `playwright.config.ts`, and `README.md`.
   - Add devDependencies: `@playwright/test`, `typescript`, `ts-node`.
   - Add scripts: `build`, `start`, `test`, `codegen` (optional).

2. Implement core library
   - `src/lib/auth.ts`: login/session strategy with env-driven credentials; optional TOTP support.
   - `src/lib/logging.ts`: redacted logging, artifact directory helpers.
   - `src/lib/guard.ts`: navigation allowlist and selector helpers.

3. Implement actions
   - `src/actions/uninstallGithubApp.ts`
   - `src/actions/restrictGithubApp.ts`
   - `src/actions/removePrSummaryBlock.ts` (prefers `gh api` first; UI fallback).

4. CLI and UX
   - `src/cli.ts`: parse args; dispatch actions; implement `--dry-run` and `--audit-dir`.
   - Emit summary to stdout; write detailed logs under `build/governance/logs/`.

5. Documentation
   - `tools/automation/playwright/README.md`: setup, required env vars, examples, dry-run, troubleshooting.
   - Security notes: secret handling, artifact retention policy.

6. CI wiring (optional, gated)
   - Add `.github/workflows/governance.yml` with `workflow_dispatch` and required secrets.
   - Do not run on PR; allow org admins only.

7. Validation
   - Dry-run on a sandbox repo (or “no-op” mode) to verify flow.
   - Capture screenshots and confirm redaction at info/warn/error levels.

8. MCP evaluation and wiring
   - Detect Docker Desktop MCP presence and Playwright MCP availability.
   - Implement `PLAYWRIGHT_RUNTIME` selector and auto-detect logic.
   - Add `src/runtime/dockerMcp.ts` with bind mounts, env secrets, and artifact mapping.
   - Update README with MCP setup steps and decision matrix.

