# Requirements Document

## Introduction
This specification defines the governance automation for managing GitHub App installations on the `nkllon/beast-semantics` repository. The system ensures only approved GitHub Apps remain installed, with deterministic automation for removal and restriction operations.

## Glossary

- **Governance System**: The automated tooling that manages GitHub App installations and enforces organizational policies
- **GitHub App**: A third-party application integrated with GitHub repositories via the GitHub Apps API
- **Automation Tool**: The Playwright-based UI automation system used when GitHub API capabilities are insufficient
- **Audit Log**: A timestamped record of governance actions stored in `build/governance/logs/`
- **Dry-Run Mode**: An execution mode that simulates actions without making actual changes

## Requirements

### Requirement 1: Unapproved App Removal

**User Story:** As a repository administrator, I want to remove unapproved GitHub Apps from the repository, so that only organization-approved tools have access to the codebase.

#### Acceptance Criteria

1. WHEN THE Governance System identifies an unapproved GitHub App, THE Governance System SHALL remove the app from the repository.
2. WHEN THE Governance System removes an app, THE Governance System SHALL record the removal action to the Audit Log with timestamp and app name.
3. WHERE multiple unapproved apps exist, THE Governance System SHALL process each app independently.

### Requirement 2: Deterministic Automation

**User Story:** As a maintainer, I want deterministic, non-interactive automation for app management, so that governance actions are reproducible and auditable.

#### Acceptance Criteria

1. WHEN THE Governance System executes an action, THE Governance System SHALL complete without requiring manual intervention.
2. WHEN THE Automation Tool is invoked, THE Automation Tool SHALL use Chromium-based browser automation.
3. WHEN an action completes, THE Governance System SHALL exit with code 0 on success and non-zero on failure.

### Requirement 3: Tool Integration

**User Story:** As a developer, I want governance tools integrated into the repository structure, so that automation is version-controlled and maintainable.

#### Acceptance Criteria

1. WHEN governance automation is needed, THE Governance System SHALL execute tools from `tools/automation/`.
2. WHEN THE Automation Tool is invoked, THE Automation Tool SHALL not require global installations.
3. WHERE automation scripts exist, THE Governance System SHALL maintain them under version control.

### Requirement 4: API-First Approach

**User Story:** As a security-conscious maintainer, I want to prefer GitHub API over UI automation, so that actions are more reliable and less brittle.

#### Acceptance Criteria

1. WHEN an action can be performed via GitHub API, THE Governance System SHALL use `gh api` or `gh` CLI commands.
2. IF GitHub API lacks required capabilities, THEN THE Governance System SHALL fall back to the Automation Tool.
3. WHEN using the Automation Tool, THE Governance System SHALL document why API approach was insufficient.

### Requirement 5: Auditability

**User Story:** As a compliance officer, I want all governance actions logged, so that I can audit who did what and when.

#### Acceptance Criteria

1. WHEN THE Governance System performs an action, THE Governance System SHALL write an entry to the Audit Log.
2. WHEN an Audit Log entry is created, THE Audit Log SHALL include timestamp, actor, action type, and target app name.
3. WHEN THE Governance System completes, THE Audit Log SHALL be stored in `build/governance/logs/` with ISO 8601 timestamp in filename.

### Requirement 6: Operational Safety

**User Story:** As an operator, I want dry-run mode and clear documentation, so that I can verify actions before execution.

#### Acceptance Criteria

1. WHEN THE Governance System is invoked with dry-run flag, THE Governance System SHALL simulate actions without making changes.
2. WHEN dry-run mode is active, THE Governance System SHALL output what would be done.
3. WHERE secrets are required, THE Governance System SHALL document required environment variables and permissions.
4. WHEN documentation is provided, THE Governance System SHALL include examples for common operations.

