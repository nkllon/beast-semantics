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

1. IF GitHub administrative tasks cannot be performed via gh CLI or GitHub API, THEN THE Automation System SHALL use Playwright for UI automation.
2. WHERE Playwright is used, THE Automation System SHALL target admin-only GitHub web tasks.

### Requirement 2: Tool Availability

**User Story:** As a developer, I want Playwright installed locally without global dependencies, so that the setup is reproducible and version-controlled.

#### Acceptance Criteria

1. THE Automation System SHALL require Node.js version 20 or higher.
2. THE Automation System SHALL install @playwright/test as a local, repository-scoped dependency.
3. THE Automation System SHALL use Chromium browser only by default.
4. THE Automation System SHALL operate without global package installations.

### Requirement 3: Security Practices

**User Story:** As a security-conscious operator, I want credentials handled securely, so that secrets are never exposed or persisted.

#### Acceptance Criteria

1. WHEN THE Automation System requires credentials, THE Automation System SHALL use environment variables or CI secrets.
2. WHEN THE Automation System logs actions, THE Automation System SHALL mask secrets in log output.
3. WHEN THE Automation System completes, THE Automation System SHALL exclude credentials from disk persistence.
4. THE Automation System SHALL exclude tokens from version control commits.
5. THE Automation System SHALL exclude cookies from version control commits.

### Requirement 4: API-First Determinism

**User Story:** As a maintainer, I want API-first approach with Playwright fallback, so that automation is reliable and maintainable.

#### Acceptance Criteria

1. WHEN an action can be performed via gh CLI or GitHub API, THE Automation System SHALL use the API approach.
2. IF GitHub API lacks required capabilities, THEN THE Automation System SHALL use Playwright UI automation.
3. WHEN Playwright is used, THE Automation System SHALL document the reason API approach was insufficient.

### Requirement 5: Non-Interactive Execution

**User Story:** As an operator, I want headless automation with failure diagnostics, so that I can run actions without manual intervention.

#### Acceptance Criteria

1. THE Automation System SHALL support headless browser mode.
2. IF an action fails, THEN THE Automation System SHALL capture screenshots.
3. IF an action fails and video recording is configured, THEN THE Automation System SHALL capture video recordings.

### Requirement 6: Auditability

**User Story:** As a compliance officer, I want audit logs for all automation actions, so that I can track what was done and when.

#### Acceptance Criteria

1. WHEN THE Automation System performs an action, THE Automation System SHALL write an audit log entry.
2. THE Automation System audit log entry SHALL include timestamp, action type, target, and outcome.
3. THE Automation System audit log entry SHALL redact sensitive information.
4. THE Automation System SHALL store audit logs in build/governance/logs/ directory with timestamps in filenames.

### Requirement 7: Idempotency

**User Story:** As an operator, I want actions to be safe to re-run, so that repeated execution doesn't cause errors or inconsistent state.

#### Acceptance Criteria

1. WHEN an action is executed multiple times, THE Automation System SHALL produce the same end state.
2. IF an action targets already-completed state, THEN THE Automation System SHALL succeed without error.
3. WHEN actions are repeated, THE Automation System SHALL log each execution in the audit trail.

### Requirement 8: Operational Surface

**User Story:** As an operator, I want both local CLI and gated CI workflows, so that I can run actions manually or via automation.

#### Acceptance Criteria

1. THE Automation System SHALL support local CLI execution.
2. WHERE CI integration is needed, THE Automation System SHALL provide a workflow_dispatch GitHub Actions workflow.
3. WHEN CI workflow is used, THE Automation System SHALL require explicit secrets and approver permissions.

### Requirement 9: Scope Control

**User Story:** As a security officer, I want browser navigation restricted to required GitHub URLs, so that automation cannot access unintended sites.

#### Acceptance Criteria

1. THE Automation System SHALL restrict navigation to github.com settings paths and related subpaths.
2. IF navigation to a non-allowlisted URL is attempted, THEN THE Automation System SHALL block the navigation and fail the action.
3. WHERE new actions require additional URLs, THE Automation System SHALL require explicit Navigation Allowlist updates.

### Requirement 10: Extensibility

**User Story:** As a maintainer, I want an action registry for common tasks, so that new governance actions can be added systematically.

#### Acceptance Criteria

1. THE Automation System SHALL provide an Action registry.
2. THE Action registry SHALL include action: uninstall GitHub App.
3. THE Action registry SHALL include action: restrict GitHub App to selected repositories.
4. THE Action registry SHALL include action: remove PR summary blocks.
5. THE Automation System SHALL support adding new actions to the Action registry.

### Requirement 11: Documentation

**User Story:** As an operator, I want comprehensive documentation, so that I can configure and use the automation system correctly.

#### Acceptance Criteria

1. THE Automation System SHALL provide operator instructions.
2. THE Automation System SHALL document required secrets and required environment variables.
3. THE Automation System SHALL document dry-run mode behavior.

### Requirement 12: MCP Runtime Evaluation

**User Story:** As a developer, I want Docker Desktop MCP as an optional runtime, so that I can use containerized Playwright when available.

#### Acceptance Criteria

1. WHERE Docker Desktop MCP is available and approved, THE Automation System SHALL support MCP-based Playwright as a first-class execution mode.
2. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess determinism.
3. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess headless reliability.
4. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess secrets handling.
5. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess artifact capture parity.
6. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess CI parity.
7. WHEN MCP Runtime is evaluated, THE Automation System SHALL assess operator ease of use.

### Requirement 13: Runtime Selection

**User Story:** As an operator, I want automatic runtime detection with manual override, so that the best available runtime is used.

#### Acceptance Criteria

1. THE Automation System SHALL support PLAYWRIGHT_RUNTIME environment variable with values node or docker-mcp.
2. IF PLAYWRIGHT_RUNTIME is not set, THEN THE Automation System SHALL auto-detect available runtimes.
3. WHILE auto-detecting runtimes, IF MCP Runtime is available and approved, THEN THE Automation System SHALL select MCP Runtime.
4. IF MCP Runtime is unavailable, THEN THE Automation System SHALL use repository-scoped Node installation of @playwright/test.

