# Implementation Plan

- [ ] 1. Create governance CLI wrapper
  - [ ] 1.1 Create `tools/automation/governance.sh` with basic structure
    - Write bash script header with shebang
    - Set up argument parsing (action, app-name, --dry-run)
    - Implement exit code handling (0 for success, 1 for failure)
    - _Requirements: 2.1, 2.3_

  - [ ] 1.2 Implement app detection logic
    - Use `gh api` to list installed apps on repository
    - Parse JSON response to extract app names and IDs
    - Handle authentication errors gracefully
    - _Requirements: 4.1_

  - [ ] 1.3 Implement dry-run mode
    - Add `--dry-run` flag handling
    - Output planned actions without executing
    - Verify no state changes occur in dry-run mode
    - _Requirements: 6.1, 6.2_

- [ ]* 1.4 Write property test for dry-run safety
  - **Property 2: Dry-run safety**
  - **Validates: Requirements 6.1, 6.2**

- [ ] 2. Implement API-first app removal
  - [ ] 2.1 Create API handler for app uninstall
    - Implement `gh api DELETE` for app installation removal
    - Handle success/failure responses
    - Return appropriate exit codes
    - _Requirements: 4.1, 1.1_

  - [ ] 2.2 Add API fallback detection
    - Detect when API method fails or is unavailable
    - Log reason for fallback to UI automation
    - Implement graceful degradation
    - _Requirements: 4.2, 4.3_

- [ ]* 2.3 Write property test for API-first preference
  - **Property 3: API-first preference**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 3. Implement UI automation fallback
  - [ ] 3.1 Integrate with Playwright toolkit
    - Invoke `uninstallGithubApp` action from ui-automation-playwright spec
    - Pass app name and repository parameters
    - Handle Playwright unavailable scenario
    - _Requirements: 2.2, 4.2_

  - [ ] 3.2 Add app restriction action
    - Invoke `restrictGithubApp` action from Playwright toolkit
    - Support repository selection modification
    - Verify action completion
    - _Requirements: 1.1_

  - [ ] 3.3 Handle UI automation errors
    - Capture screenshots on failure
    - Log detailed error information
    - Exit with appropriate error code
    - _Requirements: 2.3_

- [ ] 4. Implement audit logging
  - [ ] 4.1 Create audit logger module
    - Generate JSON-formatted audit entries
    - Include timestamp, action, app name, method, status, actor
    - Create `build/governance/logs/` directory if needed
    - _Requirements: 5.1, 5.2_

  - [ ] 4.2 Implement log file creation
    - Generate filename with ISO 8601 timestamp
    - Write JSON to file atomically
    - Handle write failures by outputting to stdout
    - _Requirements: 5.3_

  - [ ] 4.3 Add actor detection
    - Extract GitHub username from `gh` CLI
    - Include in audit log entries
    - Handle cases where actor cannot be determined
    - _Requirements: 5.2_

- [ ]* 4.4 Write property test for audit log completeness
  - **Property 1: Audit log completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 5. Implement idempotency
  - [ ] 5.1 Add app existence check
    - Query current app installations before action
    - Skip removal if app not installed
    - Log "already removed" status
    - _Requirements: 2.1_

  - [ ] 5.2 Handle repeated operations
    - Ensure uninstall can be run multiple times safely
    - Return success for already-completed actions
    - Maintain audit trail for all invocations
    - _Requirements: 2.1, 2.3_

- [ ]* 5.3 Write property test for idempotency
  - **Property 4: Idempotency**
  - **Validates: Requirements 2.1, 2.3**

- [ ] 6. Create operator documentation
  - [ ] 6.1 Write README for governance automation
    - Document required environment variables
    - Provide examples for common operations
    - Include troubleshooting section
    - _Requirements: 6.3, 6.4_

  - [ ] 6.2 Document permission requirements
    - List required GitHub permissions (repo admin)
    - Explain authentication setup with `gh` CLI
    - Document fallback to Playwright credentials
    - _Requirements: 6.3_

  - [ ] 6.3 Add usage examples
    - Example: Remove specific app
    - Example: Restrict app to selected repos
    - Example: Dry-run mode
    - _Requirements: 6.4_

- [ ] 7. Integration and validation
  - [ ] 7.1 Test API-first flow
    - Verify `gh api` successfully removes app
    - Confirm audit log created
    - Test with authenticated `gh` CLI
    - _Requirements: 4.1, 5.1_

  - [ ] 7.2 Test UI automation fallback
    - Simulate API unavailable scenario
    - Verify Playwright automation triggers
    - Confirm app removed via UI
    - _Requirements: 4.2, 2.2_

  - [ ] 7.3 Validate audit trail
    - Review audit log JSON structure
    - Verify all required fields present
    - Test log file creation in various scenarios
    - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 7.4 Run all property-based tests
  - Execute all property tests with 100+ iterations
  - Verify all properties hold across random inputs
  - Fix any discovered edge cases

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
