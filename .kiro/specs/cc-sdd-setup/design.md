# Design Document

## Overview 
Purpose: Ensure this repository has a reproducible, local-first CC-SDD (Kiro) workflow by verifying Node.js prerequisites, running the vendored CLI, and validating generated outputs.
Users: Project developers and AI agents using `/kiro/*` commands in Cursor.
Impact: Establishes a baseline spec-driven workflow without modifying upstream cc-sdd or requiring global installs.

### Goals
- Verify Node 18+ availability
- Install Kiro commands and settings via vendored CC-SDD CLI
- Confirm generated commands and settings are present and usable

### Non-Goals
- Modifying upstream cc-sdd
- Setting up CI pipelines for specs (future work)
- Implementing additional features beyond setup validation

## Architecture

### Existing Architecture Analysis
- The repo already includes a vendored `cc-sdd` under `tools/vendor/cc-sdd/`.
- The root `README.md` documents the minimal run command and refresh instructions.

### High-Level Architecture
- Inputs: Local Node runtime (>=18)
- Process: Execute vendored CLI with safe flags
- Outputs: `.cursor/commands/kiro/*`, `.kiro/settings/*`, and updated `AGENTS.md`

### Technology Alignment
- Uses Node runtime already standard for the vendored CLI
- No new dependencies introduced; operates strictly within repo boundaries

### Key Design Decisions
- Decision: Use vendored CLI, not global installs
  - Context: Ensure reproducibility and no external side-effects
  - Alternatives: Global `npx` install; git submodule
  - Selected Approach: Vendored `dist/cli.js` executed directly
  - Rationale: Deterministic, offline-friendly, reproducible in CI
  - Trade-offs: Must occasionally refresh vendor snapshot

## System Flows
1. Check Node version (`node -v`) → must be >= 18
2. Run vendored CLI with `--overwrite skip --yes` to avoid prompts and protect existing files
3. Verify presence of `.cursor/commands/kiro/*` and `.kiro/settings/*`

## Requirements Traceability
- R1 Node runtime availability → Version check flow
- R2 Vendored CC-SDD CLI installation → CLI execution flow
- R3 Generated outputs present → Post-install verification

## Components and Interfaces
### Local Environment
- Responsibility: Provide Node runtime
- External: Node.js

### Vendored CLI
- Responsibility: Generate commands and settings in-repo
- Input: Flags (`--agent`, `--profile`, `--overwrite`, `--yes`, `--backup`)
- Output: Files in `.cursor/commands/kiro` and `.kiro/settings`

## Data Models
Not applicable.

## Error Handling
- Node version too low → fail early with remediation
- CLI non-zero exit → report error and stop
- Missing outputs → fail verification with clear messaging

## Testing Strategy
- Smoke: Run CLI and assert exit code 0
- Verification: Existence checks for expected directories and representative files
- Documentation: Confirm `README.md` section matches actual usage


