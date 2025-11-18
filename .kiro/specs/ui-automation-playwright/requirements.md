# Requirements Document

## Introduction
This specification defines Playwright as the standard UI automation tool for GitHub administrative tasks that cannot be accomplished via GitHub CLI or API. The system provides deterministic, auditable browser automation with security and idempotency guarantees.

## Glossary

- **Automation System**: The Playwright-based toolkit that performs GitHub UI administrative tasks
- **Playwright**: A browser automation framework for testing and automation tasks
- **Action**: A discrete automation task (e.g., uninstall GitHub App, restrict app scope)
- **Audit Log**: A timestamped, redacted record of automation actions stored in `build/governance/logs/`
- **Navigation Allowlist**: A restricted set of GitHub URLs that the browser automation is permitted to access
- **Dry-Run Mode**: An execution mode that simulates actions without making actual changes
- **MCP Runtime**: Model Context Protocol-based Docker Desktop execution environment for Playwright

## Requirements

### Requirement 1: Tool Approval

**User Story:** As a repository administrator, I want Playwright approved as the standard UI automation tool, so that I can perform GitHub admin tasks when API is insufficient.

#### Acceptance Criteria

1. WHEN GitHub administrative tasks cannot be performed via `gh` CLI or API, THE Automation System SHALL use Playwright for UI automation.
2. WHERE Playwright is used, THE Automation System SHALL target admin-only GitHub web tasks.

### Requirement 2: Tool Availability

**User Story:** As a developer, I want Playwright installed locally without global dependencies, so that the setup is reproducible and version-controlled.

#### Acceptance Criteria

1. WHEN THE Automation System is installed, THE Automation System SHALL require Node.js version 20 or higher.
2. WHEN THE Automation System is installed, THE Automation System SHALL install `@playwright/test` as a local, repo-scoped dependency.
3. WHEN THE Automation System is installed, THE Automation System SHALL use Chromium browser only by default.
4. WHERE installation is performed, THE Automation System SHALL not require global package installations.

### Requirement 3: Security Practices

**User Story:** As a security-conscious operator, I want credentials handled securely, so that secrets are never exposed or persisted.

#### Acceptance Criteria

1. WHEN THE Automation System requires credentials, THE Automation System SHALL use environment variables or CI secrets.
2. WHEN THE Automation System logs actions, THE Automation System SHALL mask secrets in log output.
3. WHEN THE Automation System completes, THE Automation System SHALL not persist credentials to disk.
4. WHERE tokens or cookies are used, THE Automation System SHALL never commit them to version control.

### Requirement 4: API-First Determinism

**User Story:** As a maintainer, I want API-first approach with Playwright fallback, so that automation is reliable and maintainable.

#### Acceptance Criteria

1. WHEN an action can be performed via `gh` CLI or GitHub API, THE Automation System SHALL prefer the API approach.
2. IF GitHub API lacks required capabilities, THEN THE Automation System SHALL fall back to Playwright UI automation.
3. WHEN Playwright is used, THE Automation System SHALL document why API approach was insufficient.

### Requirement 5: Non-Interactive Execution

**User Story:** As an operator, I want headless automation with failure diagnostics, so that I can run actions without manual intervention.

#### Acceptance Criteria

1. WHEN THE Automation System executes actions, THE Automation System SHALL support headless browser mode.
2. IF an action fails, THEN THE Automation System SHALL capture screenshots.
3. IF an action fails, THEN THE Automation System SHALL capture video recordings when configured.

### Requirement 6: Auditability

**User Story:** As a compliance officer, I want audit logs for all automation actions, so that I can track what was done and when.

#### Acceptance Criteria

1. WHEN THE Automation System performs an action, THE Automation System SHALL write an audit log entry.
2. WHEN an audit log is created, THE Automation System SHALL include timestamp, action type, target, and outcome.
3. WHEN an audit log is created, THE Automation System SHALL redact sensitive information.
4. WHEN audit logs are written, THE Automation System SHALL store them in `build/governance/logs/` with timestamps.

### Requirement 7: Idempotency

**User Story:** As an operator, I want actions to be safe to re-run, so that repeated execution doesn't cause errors or inconsistent state.

#### Acceptance Criteria

1. WHEN an action is executed multiple times, THE Automation System SHALL produce the same end state.
2. WHEN an action targets already-completed state (e.g., app already uninstalled), THE Automation System SHALL succeed without error.
3. WHERE actions are repeated, THE Automation System SHALL log each execution in the audit trail.

### Requirement 8: Operational Surface

**User Story:** As an operator, I want both local CLI and gated CI workflows, so that I can run actions manually or via automation.

#### Acceptance Criteria

1. WHEN THE Automation System is invoked, THE Automation System SHALL support local CLI execution.
2. WHERE CI integration is needed, THE Automation System SHALL provide a `workflow_dispatch` GitHub Actions workflow.
3. WHEN CI workflow is used, THE Automation System SHALL require explicit secrets and approver permissions.

### Requirement 9: Scope Control

**User Story:** As a security officer, I want browser navigation restricted to required GitHub URLs, so that automation cannot access unintended sites.

#### Acceptance Criteria

1. WHEN THE Automation System navigates, THE Automation System SHALL restrict navigation to `github.com` settings and related subpaths.
2. IF navigation to a non-allowlisted URL is attempted, THEN THE Automation System SHALL block the navigation and fail the action.
3. WHERE new actions require additional URLs, THE Automation System SHALL require explicit allowlist updates.

### Requirement 10: Extensibility

**User Story:** As a maintainer, I want an action registry for common tasks, so that new governance actions can be added systematically.

#### Acceptance Criteria

1. WHEN THE Automation System is implemented, THE Automation System SHALL provide an action registry.
2. WHEN the action registry is provided, THE Automation System SHALL include actions for: uninstall GitHub App, restrict GitHub App to selected repos, remove PR summary blocks.
3. WHERE new actions are needed, THE Automation System SHALL support adding actions to the registry.

### Requirement 11: Documentation

**User Story:** As an operator, I want comprehensive documentation, so that I can configure and use the automation system correctly.

#### Acceptance Criteria

1. WHEN documentation is provided, THE Automation System SHALL include operator instructions.
2. WHEN documentation is provided, THE Automation System SHALL document required secrets and environment variables.
3. WHEN documentation is provided, THE Automation System SHALL explain dry-run mode behavior.

### Requirement 12: MCP Runtime Evaluation

**User Story:** As a developer, I want Docker Desktop MCP as an optional runtime, so that I can use containerized Playwright when available.

#### Acceptance Criteria

1. WHERE Docker Desktop MCP is available and approved, THE Automation System SHALL support MCP-based Playwright as a first-class execution mode.
2. WHEN MCP runtime is evaluated, THE Automation System SHALL assess determinism, headless reliability, secrets handling, artifact capture parity, CI parity, and operator ease of use.

### Requirement 13: Runtime Selection

**User Story:** As an operator, I want automatic runtime detection with manual override, so that the best available runtime is used.

#### Acceptance Criteria

1. WHEN THE Automation System starts, THE Automation System SHALL support environment variable `PLAYWRIGHT_RUNTIME` with values `node` or `docker-mcp`.
2. IF `PLAYWRIGHT_RUNTIME` is not set, THEN THE Automation System SHALL auto-detect available runtimes.
3. WHEN auto-detecting, THE Automation System SHALL prefer MCP when available and approved.
4. IF MCP is unavailable, THEN THE Automation System SHALL fall back to repo-scoped Node installation of `@playwright/test`.

