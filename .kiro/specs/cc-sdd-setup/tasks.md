# Implementation Plan

## Task Overview
The CC-SDD tooling is already installed. These tasks focus on creating verification tooling and enhancing documentation to ensure the setup is validated and reproducible.

## Implementation Tasks

- [ ] 1. Create verification script
  - Create `tools/verify-cc-sdd.sh` with executable permissions
  - Implement Node.js version check (>= 18)
  - Implement commands check (11 expected files in `.cursor/commands/kiro/`)
  - Implement settings structure check (`.kiro/settings/rules/` and `.kiro/settings/templates/`)
  - Implement AGENTS.md existence check
  - Output clear pass/fail report with specific details
  - Exit with code 0 on success, 1 on failure
  - _Requirements: R2, R4_
  - _Estimated effort: 30 minutes_

- [ ] 2. Enhance README.md documentation
  - Add "Verification" subsection under "Using bundled cc-sdd"
  - Document how to run `tools/verify-cc-sdd.sh`
  - Clarify Node.js 18+ prerequisite prominently
  - Ensure installation command is complete and accurate
  - Ensure refresh procedure is clear
  - Add troubleshooting guidance (what to do if verification fails)
  - _Requirements: R1, R3_
  - _Estimated effort: 15 minutes_

- [ ] 3. Validate implementation
  - Run verification script on current repository state (should pass)
  - Test negative case: temporarily rename a command file, verify script detects it
  - Test Node version check with mock version output
  - Verify README.md instructions are complete and accurate
  - Confirm all acceptance criteria are met
  - _Requirements: R1, R2, R3, R4_
  - _Estimated effort: 15 minutes_

- [ ] 4. Implement release immutability
  - Create `tools/release-freeze.sh` to snapshot artifacts into `build/releases/<version>/`
  - Include `AGENTS.md`, `README.md`, `.cursor/commands/kiro/**`, `.kiro/settings/**`, `tools/**`
  - Generate `MANIFEST.sha256` for all snapshot files
  - Extend `tools/verify-cc-sdd.sh` to accept `--release <version>` and validate checksums
  - Document the release process in `README.md` (freeze, verify, tag/push)
  - _Requirements: R5_
  - _Estimated effort: 45 minutes_

## Task Dependencies
- Task 2 depends on Task 1 (need script path for documentation)
- Task 3 depends on Tasks 1 and 2 (validates both deliverables)

## Total Estimated Effort
~60 minutes

## Success Criteria
- Verification script runs successfully and reports current installation as valid
- README.md provides complete setup and verification instructions
- All acceptance criteria from requirements document are satisfied
- Documentation is clear enough for a new developer to follow


