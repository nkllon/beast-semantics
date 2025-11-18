# Design Document

## Overview 
Purpose: Provide verification tooling and documentation to ensure the CC-SDD (Kiro) setup in this repository is complete, correct, and reproducible.
Users: Project developers and AI agents using `/kiro/*` commands in Cursor.
Impact: Establishes confidence in the spec-driven workflow setup and provides clear procedures for maintenance and troubleshooting.

### Goals
- Create automated verification script for CC-SDD installation state
- Document environment prerequisites and setup procedures
- Ensure reproducibility of setup across environments
- Provide clear troubleshooting guidance

### Non-Goals
- Modifying upstream cc-sdd
- Implementing new CC-SDD features
- Setting up CI pipelines (future work)
- Creating custom Kiro commands beyond verification

## Architecture

### Existing Architecture Analysis
- **Vendored CLI**: `tools/vendor/cc-sdd/dist/cli.js` already present
- **Commands**: `.cursor/commands/kiro/*` already installed (11 command files)
- **Settings**: `.kiro/settings/*` structure already exists (rules and templates)
- **Documentation**: `README.md` already contains CC-SDD usage section
- **Guidance**: `AGENTS.md` already provides AI agent steering

### Current State
The CC-SDD tooling is **already installed and functional**. This spec focuses on:
1. Verifying the installation is complete
2. Documenting the setup for reproducibility
3. Providing maintenance procedures

### High-Level Architecture
```
Verification Script (tools/verify-cc-sdd.sh)
  ├─> Check Node.js version (>= 18)
  ├─> Verify .cursor/commands/kiro/* (11 files)
  ├─> Verify .kiro/settings/* structure
  ├─> Verify AGENTS.md exists
  └─> Report: PASS/FAIL with details
```

### Technology Alignment
- Bash script for verification (portable, no new dependencies)
- Uses existing Node runtime for version check
- File system checks only (fast, reliable)

### Key Design Decisions

**Decision 1: Verification script over installation script**
- Context: Tooling already installed; need to validate state
- Alternatives: Installation script, manual checklist, CI-only checks
- Selected Approach: Standalone verification script
- Rationale: Validates current state, useful for troubleshooting, can be run anytime
- Trade-offs: Doesn't fix issues automatically (by design - keeps it simple)

**Decision 2: Bash script location**
- Context: Need discoverable, maintainable location
- Alternatives: `tools/`, `.kiro/`, root directory
- Selected Approach: `tools/verify-cc-sdd.sh`
- Rationale: Consistent with existing `tools/` structure (assemble.py, validate.py)
- Trade-offs: None significant

**Decision 3: Documentation enhancement over new docs**
- Context: README.md already has CC-SDD section
- Alternatives: New SETUP.md, inline comments only
- Selected Approach: Enhance existing README.md section
- Rationale: Single source of truth, developers already look there
- Trade-offs: README grows slightly longer

## System Flows

### Verification Flow
1. **Node Check**: Execute `node -v`, parse version, compare to minimum (18)
2. **Commands Check**: Verify 11 expected files in `.cursor/commands/kiro/`:
   - `spec-design.md`
   - `spec-impl.md`
   - `spec-init.md`
   - `spec-requirements.md`
   - `spec-status.md`
   - `spec-tasks.md`
   - `steering-custom.md`
   - `steering.md`
   - `validate-design.md`
   - `validate-gap.md`
   - `validate-impl.md`
3. **Settings Check**: Verify directory structure in `.kiro/settings/`
4. **Guidance Check**: Verify `AGENTS.md` exists
5. **Report**: Output summary (all checks passed / X checks failed)

### Release Freeze Flow (immutability)
1. **Input**: Version string `<version>` (SemVer recommended)
2. **Preconditions**: Clean git working tree; current branch is main or a release branch
3. **Snapshot**: Create `build/releases/<version>/`
4. **Copy Artifacts**: Include `AGENTS.md`, `README.md`, `.cursor/commands/kiro/**`, `.kiro/settings/**`, and `tools/**`
5. **Checksums**: Generate `MANIFEST.sha256` with SHA-256 for all files in the snapshot
6. **Optional Tag**: Create a git tag `v<version>` and push
7. **Verify**: `verify-cc-sdd.sh --release <version>` confirms manifest matches

### Installation Flow (documented, not automated)
1. Developer reads README.md prerequisites
2. Developer runs documented CLI command
3. Developer runs verification script to confirm
4. If verification fails, developer troubleshoots using output

## Requirements Traceability
- R1 Environment prerequisites documented → Enhanced README.md section
- R2 Installation state verified → Verification script checks
- R3 Setup reproducibility ensured → Documented CLI command and refresh procedure
- R4 Verification automation available → `tools/verify-cc-sdd.sh` script
- R5 Release immutability → `tools/release-freeze.sh` script and `--release` verification mode

## Components and Interfaces

### Verification Script (`tools/verify-cc-sdd.sh`)
- **Responsibility**: Validate CC-SDD installation completeness
- **Input**: File system state; optional `--release <version>` to validate a frozen release
- **Output**: Exit code (0=pass, 1=fail) and human-readable report
- **Dependencies**: bash, node (for version check)

### Release Freeze Script (`tools/release-freeze.sh`)
- **Responsibility**: Produce immutable release snapshot with checksums
- **Input**: `<version>` argument; optional `--tag` to create a git tag
- **Output**: `build/releases/<version>/` and `MANIFEST.sha256`
- **Dependencies**: bash, find, shasum (or sha256sum), git (optional tag)

### Documentation (`README.md`)
- **Responsibility**: Provide setup and maintenance procedures
- **Sections**: Prerequisites, Installation command, Verification, Refresh procedure
- **Audience**: Developers setting up or maintaining the repo

### Expected File Structure
```
.cursor/commands/kiro/
  ├─ spec-init.md
  ├─ spec-requirements.md
  ├─ spec-design.md
  ├─ spec-tasks.md
  ├─ spec-impl.md
  ├─ spec-status.md
  ├─ steering.md
  ├─ steering-custom.md
  ├─ validate-gap.md
  ├─ validate-design.md
  └─ validate-impl.md

.kiro/settings/
  ├─ rules/
  └─ templates/

AGENTS.md (root)
```

## Data Models
Not applicable (file system checks only).

## Error Handling

### Node Version Check Failure
- **Condition**: Node < 18 or not found
- **Response**: Exit 1, output "Node.js 18+ required. Current: X.Y.Z" or "Node.js not found"
- **Remediation**: Install/upgrade Node.js

### Missing Commands
- **Condition**: Expected command files not found
- **Response**: Exit 1, list missing files
- **Remediation**: Run installation command from README.md

### Missing Settings
- **Condition**: Settings structure incomplete
- **Response**: Exit 1, report missing directories
- **Remediation**: Run installation command from README.md

### Missing AGENTS.md
- **Condition**: AGENTS.md not found
- **Response**: Exit 1, report missing file
- **Remediation**: Run installation command from README.md

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete file verification
*For any* valid CC-SDD installation, all 11 expected command files should exist in `.cursor/commands/kiro/` when verification passes.
**Validates: Requirements 2.1, 2.4**

### Property 2: Node version enforcement
*For any* system where Node.js version is less than 18, verification should fail with exit code 1 and provide the current version in the error message.
**Validates: Requirements 1.2, 1.3**

### Property 3: Release manifest integrity
*For any* release snapshot with a MANIFEST.sha256 file, all files listed in the manifest should have SHA-256 checksums that match the actual file contents.
**Validates: Requirements 5.3, 5.4**

### Property 4: Verification idempotency
*For any* repository state, running verification multiple times should produce the same result (pass or fail) without modifying any files.
**Validates: Requirements 2.5, 4.1**

## Testing Strategy

### Unit Testing
- **Node version parsing**: Test extraction and comparison of version numbers
- **File existence checks**: Test detection of missing files
- **Checksum generation**: Test SHA-256 hash generation and verification
- **Error message formatting**: Verify clarity and actionability

### Property-Based Testing
- **Property 1 (Complete verification)**: Test with various file presence combinations, verify correct pass/fail
- **Property 2 (Node version)**: Test with various Node versions, verify correct enforcement
- **Property 3 (Manifest integrity)**: Generate random file sets, verify checksums match
- **Property 4 (Idempotency)**: Run verification multiple times, verify identical results

### Verification Script Testing
- **Positive case**: Run on current repo (should pass)
- **Negative cases**: 
  - Temporarily rename a command file (should fail with specific message)
  - Mock Node version < 18 (should fail with version message)
- **Edge cases**: Empty directories, symlinks

### Documentation Testing
- **Completeness**: All commands and flags documented
- **Accuracy**: Commands run successfully as documented
- **Clarity**: New developer can follow without assistance

### Integration Testing
- **Fresh clone**: Clone repo, follow README, run verification
- **Expected outcome**: Verification passes without additional steps


