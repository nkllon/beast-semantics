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

1. WHEN THE Governance System identifies an unapproved GitHub App, THE Governance System SHALL remove the GitHub App from the repository.
2. WHEN THE Governance System removes a GitHub App, THE Governance System SHALL record timestamp and app name to the Audit Log.
3. WHERE multiple unapproved GitHub Apps exist, THE Governance System SHALL process each GitHub App independently.

### Requirement 2: Deterministic Automation

**User Story:** As a maintainer, I want deterministic, non-interactive automation for app management, so that governance actions are reproducible and auditable.

#### Acceptance Criteria

1. WHEN THE Governance System executes an action, THE Governance System SHALL complete without manual intervention.
2. THE Automation Tool SHALL use Chromium-based browser automation.
3. WHEN an action completes successfully, THE Governance System SHALL exit with code 0.
4. WHEN an action fails, THE Governance System SHALL exit with non-zero code.

### Requirement 3: Tool Integration

**User Story:** As a developer, I want governance tools integrated into the repository structure, so that automation is version-controlled and maintainable.

#### Acceptance Criteria

1. WHEN governance automation is needed, THE Governance System SHALL execute tools from tools/automation/ directory.
2. THE Automation Tool SHALL operate without global package installations.
3. THE Governance System SHALL maintain automation scripts under version control.

### Requirement 4: API-First Approach

**User Story:** As a security-conscious maintainer, I want to prefer GitHub API over UI automation, so that actions are more reliable and less brittle.

#### Acceptance Criteria

1. WHEN an action can be performed via GitHub API, THE Governance System SHALL use gh api or gh CLI commands.
2. IF GitHub API lacks required capabilities, THEN THE Governance System SHALL use the Automation Tool.
3. WHEN the Automation Tool is used, THE Governance System SHALL document the reason API approach was insufficient.

### Requirement 5: Auditability

**User Story:** As a compliance officer, I want all governance actions logged, so that I can audit who did what and when.

#### Acceptance Criteria

1. WHEN THE Governance System performs an action, THE Governance System SHALL write an entry to the Audit Log.
2. THE Audit Log entry SHALL include timestamp, actor, action type, and target app name.
3. WHEN THE Governance System completes, THE Governance System SHALL store the Audit Log in build/governance/logs/ directory with ISO 8601 timestamp in filename.

### Requirement 6: Operational Safety

**User Story:** As an operator, I want dry-run mode and clear documentation, so that I can verify actions before execution.

#### Acceptance Criteria

1. WHEN THE Governance System is invoked with dry-run flag, THE Governance System SHALL simulate actions without modifying repository state.
2. WHILE dry-run mode is active, THE Governance System SHALL output planned actions.
3. WHERE secrets are required, THE Governance System SHALL document required environment variables and required permissions.
4. THE Governance System SHALL provide documentation with examples for common operations.

