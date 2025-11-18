# Design Document

## Overview
Purpose: Provide automated governance tooling to manage GitHub App installations on the `nkllon/beast-semantics` repository, ensuring only approved apps have access.
Users: Repository administrators and maintainers enforcing organizational policies.
Impact: Reduces security risk by removing unapproved third-party integrations and provides audit trail for compliance.

### Goals
- Remove unapproved GitHub Apps (e.g., Cursor Bugbot) from repository
- Provide deterministic, repeatable automation for app management
- Create audit trail for all governance actions
- Support both API-first and UI automation approaches

### Non-Goals
- Managing GitHub Apps at organization level (repo-scoped only)
- Creating new GitHub Apps
- Modifying app permissions (only install/uninstall/restrict)
- Real-time monitoring of app installations

## Architecture

### High-Level Architecture
```
Governance CLI (tools/automation/governance.sh)
  ├─> Detect available methods (gh api vs Playwright)
  ├─> Execute action (uninstall/restrict)
  │   ├─> Try: gh api (GitHub REST API)
  │   └─> Fallback: Playwright UI automation
  └─> Write audit log to build/governance/logs/
```

### Technology Stack
- **Primary**: `gh` CLI for GitHub API operations
- **Fallback**: Playwright (via ui-automation-playwright spec)
- **Scripting**: Bash for orchestration
- **Logging**: JSON-formatted audit logs

### Integration with Existing Specs
This spec **depends on** the `ui-automation-playwright` spec for UI automation capabilities. The Playwright toolkit provides the fallback mechanism when GitHub API is insufficient.

### Key Design Decisions

**Decision 1: Wrapper script over direct Playwright invocation**
- Context: Need to try API first, then fall back to UI automation
- Alternatives: Always use Playwright, always use API, manual selection
- Selected Approach: Intelligent wrapper that tries API first
- Rationale: Maximizes reliability (API) while providing fallback (UI)
- Trade-offs: Additional layer of indirection

**Decision 2: Repo-scoped operations only**
- Context: GitHub Apps can be installed at org or repo level
- Alternatives: Support both org and repo scope
- Selected Approach: Repo-scoped only (`nkllon/beast-semantics`)
- Rationale: Simpler permissions model, matches current need
- Trade-offs: Cannot manage org-level installations

**Decision 3: JSON audit logs**
- Context: Need structured, parseable audit trail
- Alternatives: Plain text logs, database storage
- Selected Approach: JSON files with ISO 8601 timestamps
- Rationale: Easy to parse, version-controllable, no external dependencies
- Trade-offs: No query capabilities without additional tooling

## System Flows

### App Removal Flow
1. **Input**: App name (e.g., "Cursor Bugbot")
2. **API Attempt**: Try `gh api` to list and remove app installation
3. **API Check**: If successful, skip to audit log
4. **UI Fallback**: If API fails/insufficient, invoke Playwright automation
5. **Verification**: Confirm app no longer appears in repository settings
6. **Audit**: Write action details to `build/governance/logs/<timestamp>.json`

### App Restriction Flow
1. **Input**: App name and target repository list
2. **API Attempt**: Try `gh api` to modify app installation scope
3. **API Check**: If successful, skip to audit log
4. **UI Fallback**: If API fails, invoke Playwright to navigate settings UI
5. **Verification**: Confirm app scope updated correctly
6. **Audit**: Write action details to audit log

### Dry-Run Flow
1. **Input**: Action with `--dry-run` flag
2. **Detection**: Query current state (installed apps)
3. **Simulation**: Output what would be done without executing
4. **Report**: Display planned actions and exit

## Components and Interfaces

### Governance CLI (`tools/automation/governance.sh`)
- **Responsibility**: Orchestrate app management actions
- **Input**: Action (uninstall/restrict), app name, flags (--dry-run)
- **Output**: Exit code (0=success, 1=failure), audit log file
- **Dependencies**: gh CLI, Playwright toolkit (optional)

### API Handler
- **Responsibility**: Attempt GitHub API operations
- **Interface**: Uses `gh api` commands
- **Endpoints**: 
  - `GET /repos/{owner}/{repo}/installations` - List apps
  - `DELETE /repos/{owner}/{repo}/installations/{id}` - Remove app
- **Exit codes**: 0 (success), 1 (API unavailable/failed)

### UI Automation Handler
- **Responsibility**: Perform UI-based app management
- **Interface**: Invokes Playwright actions from ui-automation-playwright spec
- **Actions**: `uninstallGithubApp`, `restrictGithubApp`
- **Dependencies**: Playwright toolkit must be available

### Audit Logger
- **Responsibility**: Record governance actions
- **Output Format**:
```json
{
  "timestamp": "2025-11-17T10:30:00Z",
  "action": "uninstall",
  "app_name": "Cursor Bugbot",
  "repository": "nkllon/beast-semantics",
  "method": "api|ui",
  "status": "success|failure",
  "actor": "username",
  "dry_run": false
}
```
- **Location**: `build/governance/logs/YYYYMMDD-HHMMSS-action.json`

## Data Models

### App Installation
```json
{
  "id": 12345,
  "app_name": "Cursor Bugbot",
  "app_slug": "cursor-bugbot",
  "repository_selection": "selected|all",
  "permissions": {}
}
```

### Governance Action
```json
{
  "action_type": "uninstall|restrict",
  "target_app": "string",
  "target_repo": "owner/repo",
  "dry_run": boolean,
  "timestamp": "ISO 8601 string"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Audit log completeness
*For any* governance action executed (not in dry-run mode), an audit log entry should be created in `build/governance/logs/` with all required fields populated.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 2: Dry-run safety
*For any* governance action executed with `--dry-run` flag, no changes should be made to the actual GitHub repository state (verified by comparing before/after app installation lists).
**Validates: Requirements 6.1, 6.2**

### Property 3: API-first preference
*For any* governance action where both API and UI methods are available, the system should attempt the API method before falling back to UI automation.
**Validates: Requirements 4.1, 4.2**

### Property 4: Idempotency
*For any* app that is already uninstalled, running the uninstall action should succeed without error and record the action as "already removed" in the audit log.
**Validates: Requirements 2.1, 2.3**

## Error Handling

### API Unavailable
- **Condition**: `gh` CLI not installed or not authenticated
- **Response**: Log warning, attempt UI automation fallback
- **Remediation**: Install/authenticate `gh` CLI

### Playwright Unavailable
- **Condition**: Playwright toolkit not installed
- **Response**: Exit 1 with error message
- **Remediation**: Complete ui-automation-playwright spec implementation

### App Not Found
- **Condition**: Specified app not installed on repository
- **Response**: Exit 0 (success), log "app not found" in audit
- **Remediation**: None needed (idempotent)

### Permission Denied
- **Condition**: Insufficient permissions to manage apps
- **Response**: Exit 1 with clear error message
- **Remediation**: Ensure admin permissions on repository

### Audit Log Write Failure
- **Condition**: Cannot write to `build/governance/logs/`
- **Response**: Print audit data to stdout, exit 1
- **Remediation**: Check directory permissions

## Testing Strategy

### Unit Testing
- **API handler**: Mock `gh api` responses for success/failure cases
- **Audit logger**: Verify JSON structure and file creation
- **Dry-run mode**: Confirm no state changes occur

### Integration Testing
- **End-to-end**: Test on sandbox repository with test app
- **API fallback**: Simulate API failure, verify UI automation triggers
- **Audit trail**: Verify complete audit log after each action

### Property-Based Testing
- **Property 1 (Audit completeness)**: Generate random governance actions, verify audit log exists with all fields
- **Property 2 (Dry-run safety)**: Generate random actions with --dry-run, verify no state changes
- **Property 3 (API-first)**: Mock both API and UI available, verify API attempted first
- **Property 4 (Idempotency)**: Run same uninstall action twice, verify both succeed

### Manual Testing
- **Real app removal**: Test removing actual unapproved app from repository
- **Permission verification**: Test with different permission levels
- **Documentation**: Follow operator docs to perform common tasks

## Security Considerations

### Credential Management
- Use environment variables for GitHub credentials
- Never log credentials or tokens
- Support GitHub CLI's native authentication

### Audit Log Security
- Redact sensitive data (tokens, passwords) from logs
- Store logs in gitignored directory
- Include actor information for accountability

### Scope Limitation
- Restrict to repository-level operations only
- Validate repository name matches expected value
- Fail fast if attempting org-level operations

## Dependencies

### Required
- `gh` CLI (authenticated)
- Bash 4.0+
- `jq` for JSON manipulation

### Optional
- Playwright toolkit (from ui-automation-playwright spec)
- Docker Desktop (if using Playwright MCP mode)

## Out of Scope
- Organization-level app management
- App permission modification (beyond install/uninstall/restrict)
- Real-time monitoring or alerting
- Web UI for governance operations
