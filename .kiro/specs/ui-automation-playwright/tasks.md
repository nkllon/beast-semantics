# Implementation Plan

- [ ] 1. Scaffold automation package
  - [ ] 1.1 Create project structure
    - Create `tools/automation/playwright/` directory
    - Create `package.json` with devDependencies: `@playwright/test`, `typescript`, `ts-node`
    - Create `tsconfig.json` with appropriate compiler options
    - Create `playwright.config.ts` with headless and artifact settings
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 1.2 Set up build and execution scripts
    - Add `build` script to compile TypeScript
    - Add `start` script for CLI execution
    - Add `test` script for running tests
    - Add optional `codegen` script for Playwright code generation
    - _Requirements: 2.2, 8.1_

  - [ ] 1.3 Create README structure
    - Create `tools/automation/playwright/README.md` with sections for setup, usage, and troubleshooting
    - _Requirements: 11.1_

- [ ] 2. Implement core library modules
  - [ ] 2.1 Implement authentication module
    - Create `src/lib/auth.ts` with login/session strategy
    - Support environment variable-driven credentials
    - Add optional TOTP support for 2FA
    - Ensure no credential persistence
    - _Requirements: 3.1, 3.3_

  - [ ] 2.2 Implement logging module
    - Create `src/lib/logging.ts` with redacted logging functions
    - Implement artifact directory helpers
    - Add secret pattern detection and masking
    - _Requirements: 3.2, 6.3_

  - [ ] 2.3 Implement navigation guard
    - Create `src/lib/guard.ts` with navigation allowlist enforcement
    - Implement URL validation against allowlist patterns
    - Add selector helpers for GitHub UI elements
    - _Requirements: 9.1, 9.2_

- [ ]* 2.4 Write property test for navigation allowlist
  - **Property 1: Navigation allowlist enforcement**
  - **Validates: Requirements 9.1, 9.2**

- [ ]* 2.5 Write property test for secret redaction
  - **Property 3: Secret redaction**
  - **Validates: Requirements 3.2, 6.3**

- [ ] 3. Implement action modules
  - [ ] 3.1 Implement uninstall GitHub App action
    - Create `src/actions/uninstallGithubApp.ts`
    - Try `gh api` approach first
    - Fall back to Playwright UI automation if API insufficient
    - Handle already-uninstalled case (idempotency)
    - _Requirements: 1.1, 4.1, 4.2, 7.1, 7.2, 10.2_

  - [ ] 3.2 Implement restrict GitHub App action
    - Create `src/actions/restrictGithubApp.ts`
    - Modify app installation scope to selected repositories
    - Support removing specific repos from app access
    - _Requirements: 1.1, 4.1, 4.2, 10.2_

  - [ ] 3.3 Implement remove PR summary block action
    - Create `src/actions/removePrSummaryBlock.ts`
    - Prefer `gh api` for PR body editing
    - Fall back to UI if editing is locked
    - _Requirements: 4.1, 4.2, 10.2_

- [ ]* 3.4 Write property test for idempotency
  - **Property 4: Idempotency**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 3.5 Write property test for API-first preference
  - **Property 5: API-first preference**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 4. Implement CLI and audit logging
  - [ ] 4.1 Create CLI interface
    - Create `src/cli.ts` with argument parsing
    - Implement action dispatch based on command
    - Add `--dry-run` flag support
    - Add `--audit-dir` flag for custom audit log location
    - _Requirements: 8.1, 11.3_

  - [ ] 4.2 Implement audit logging
    - Create audit log entries with timestamp, action, target, outcome
    - Write logs to `build/governance/logs/` with ISO 8601 timestamps
    - Ensure redaction of sensitive information
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 4.3 Implement dry-run mode
    - Simulate actions without making changes
    - Output what would be done
    - Verify no state changes occur
    - _Requirements: 11.3_

  - [ ] 4.4 Add summary output
    - Emit concise summary to stdout
    - Include action result and audit log location
    - _Requirements: 8.1_

- [ ]* 4.5 Write property test for audit log completeness
  - **Property 2: Audit log completeness**
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ]* 4.6 Write property test for dry-run safety
  - **Property 6: Dry-run safety**
  - **Validates: Requirements 11.3**

- [ ] 5. Implement runtime abstraction
  - [ ] 5.1 Create runtime selector
    - Create `src/lib/runtime.ts` with unified `runAction` interface
    - Support `PLAYWRIGHT_RUNTIME` environment variable
    - Implement auto-detection logic (prefer MCP when available)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 5.2 Implement Node runtime
    - Create `src/runtime/node.ts`
    - Spawn `@playwright/test` programmatically
    - Handle process lifecycle and output capture
    - _Requirements: 2.2, 13.4_

  - [ ] 5.3 Implement Docker MCP runtime
    - Create `src/runtime/dockerMcp.ts`
    - Invoke MCP container with bind-mounted workspace
    - Pass environment secrets securely
    - Map artifacts to `build/governance/logs/`
    - _Requirements: 12.1, 13.3_

  - [ ] 5.4 Ensure artifact parity
    - Verify both runtimes produce identical artifact structure
    - Test screenshots, traces, and console logs
    - _Requirements: 12.2_

- [ ] 6. Create comprehensive documentation
  - [ ] 6.1 Document setup and installation
    - Explain Node.js requirements
    - Document npm install procedure
    - Include Playwright browser installation
    - _Requirements: 2.1, 11.1_

  - [ ] 6.2 Document required secrets
    - List all required environment variables
    - Explain GitHub authentication options
    - Document TOTP setup for 2FA
    - _Requirements: 3.1, 11.2_

  - [ ] 6.3 Document action usage
    - Provide examples for each action
    - Explain dry-run mode
    - Include troubleshooting section
    - _Requirements: 10.2, 11.1, 11.3_

  - [ ] 6.4 Document MCP runtime
    - Explain MCP setup and detection
    - Document runtime selection via environment variable
    - Provide decision matrix for choosing runtime
    - _Requirements: 12.1, 13.1_

  - [ ] 6.5 Document security practices
    - Explain secret handling and redaction
    - Document artifact retention policy
    - Provide security best practices
    - _Requirements: 3.2, 3.4, 6.3_

- [ ] 7. Implement CI integration (optional)
  - [ ] 7.1 Create governance workflow
    - Create `.github/workflows/governance.yml`
    - Use `workflow_dispatch` trigger only
    - Require explicit secrets as inputs
    - _Requirements: 8.2, 8.3_

  - [ ] 7.2 Configure workflow permissions
    - Restrict to org/repo admins only
    - Do not run on PR events
    - Document required approver permissions
    - _Requirements: 8.3_

  - [ ] 7.3 Add workflow documentation
    - Explain how to trigger workflow
    - Document required secrets configuration
    - Provide usage examples
    - _Requirements: 8.2, 11.1_

- [ ] 8. Validation and testing
  - [ ] 8.1 Test on sandbox repository
    - Perform dry-run on test repository
    - Execute real actions on sandbox
    - Verify no impact on production
    - _Requirements: 7.1, 11.3_

  - [ ] 8.2 Test failure scenarios
    - Trigger intentional failures
    - Verify screenshot capture
    - Verify video capture when enabled
    - _Requirements: 5.2, 5.3_

  - [ ] 8.3 Validate redaction
    - Test with various secret patterns
    - Verify redaction in logs at all levels (info/warn/error)
    - Confirm no secrets in artifacts
    - _Requirements: 3.2, 6.3_

  - [ ] 8.4 Test both runtimes
    - Execute actions using Node runtime
    - Execute actions using Docker MCP runtime
    - Verify identical behavior and artifacts
    - _Requirements: 12.1, 13.3, 13.4_

- [ ]* 8.5 Run all property-based tests
  - Execute all property tests with 100+ iterations
  - Verify all properties hold across random inputs
  - Fix any discovered edge cases

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
