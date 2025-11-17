# Requirements Document

## Introduction
This specification defines the environment verification and local installation of the vendored CC-SDD (Kiro) tooling in this repository, along with verification that generated commands and settings are available for use by engineering agents.

## Requirements

### Requirement 1: Node runtime availability
**Objective:** As a developer, I want Node.js 18+ available, so that the vendored CC-SDD CLI can run reliably.

#### Acceptance Criteria
1. WHEN `node -v` is executed THEN the reported major version SHALL be greater than or equal to 18.
2. IF Node is below the required version THEN the setup SHALL fail with a clear remediation message.
3. WHILE the environment is prepared THE project SHALL document the minimum Node requirement.
4. WHERE CI or local setup runs THE Node requirement SHALL be validated early.

### Requirement 2: Vendored CC-SDD CLI installation
**Objective:** As a developer, I want to install Kiro commands and settings using the vendored CC-SDD CLI, so that spec-driven development workflows are available locally without external dependencies.

#### Acceptance Criteria
1. WHEN the vendored CLI is executed with `--agent cursor --profile minimal --yes --overwrite skip` THEN the operation SHALL complete without errors.
2. WHEN the CLI runs THEN changes SHALL be restricted to this repository (no global side-effects).
3. IF files already exist THEN the CLI SHALL skip overwriting by default (per `--overwrite skip`) and report skipped counts.

### Requirement 3: Generated outputs present
**Objective:** As a developer, I want the generated Kiro commands and settings to be present, so that I can use `/kiro/*` commands and maintain steering/specs.

#### Acceptance Criteria
1. WHEN installation completes THEN `.cursor/commands/kiro/*` files SHALL exist (spec-*, steering-*, validate-*).
2. WHEN installation completes THEN `.kiro/settings/*` templates and rules SHALL exist as provided by the vendor.
3. WHERE repository documentation references CC-SDD usage THE root `README.md` SHALL include a minimal run command and refresh instructions.


