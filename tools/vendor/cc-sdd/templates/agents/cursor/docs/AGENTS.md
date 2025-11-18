# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `{{KIRO_DIR}}/steering/`
- Specs: `{{KIRO_DIR}}/specs/`

### Steering vs Specification

**Steering** (`{{KIRO_DIR}}/steering/`) - Guide AI with project-wide rules and context
**Specs** (`{{KIRO_DIR}}/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `{{KIRO_DIR}}/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines
{{DEV_GUIDELINES}}

## Minimal Workflow
- Phase 0 (optional): `/kiro/steering`, `/kiro/steering-custom`
- Phase 1 (Specification):
  - `/kiro/spec-init "description"`
  - `/kiro/spec-requirements {feature}`
  - `/kiro/validate-gap {feature}` (optional: for existing codebase)
  - `/kiro/spec-design {feature} [-y]`
  - `/kiro/validate-design {feature}` (optional: design review)
  - `/kiro/spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro/spec-impl {feature} [tasks]`
  - `/kiro/validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro/spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro/spec-status`

## Steering Configuration
- Load entire `{{KIRO_DIR}}/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)

## CLI and Tools Assumptions (Cursor)
- Prefer `gh` (GitHub CLI) for GitHub operations (PRs, issues, metadata).
- Assume `gh` is installed and authenticated in the environment.
- Only fall back to raw `curl` for GitHub if `gh` cannot cover the scenario.

## Hard Rules (Cursor)
- Do not ask to install `gh`; assume it exists. If missing, fail fast with a clear instruction.
- Do not invent new tools where first-class tools exist in this repo or CI.
- Do not perform “tool discovery.” Use the tool matrix below; escalate only if a listed tool cannot satisfy the need.
- Prefer project scripts in `tools/` over rolling your own logic.

## Tool Selection Matrix (Cursor)
- GitHub PRs/Issues/Metadata: `gh` (`gh pr list/view/create`, `gh issue ...`, `gh repo view`, `gh pr checks`).
- GitHub arbitrary endpoints: `gh api` with `--jq/--paginate` when needed.
- Git operations: `git` CLI (status, log, diff, worktree).
- SPARQL checks: `node tools/sparql_check.mjs queries`.
- RDF validation: Apache Jena RIOT (`riot --validate`) as the source of truth.
- RDF lint/style: `rdflint` (match CI behavior).
- TTL quick parse (local): `python tools/lint_ttl.py` (fallback; not a substitute for RIOT/rdflint).
- Secrets scanning: `gitleaks`.
- Python deps audit: `pip-audit` with CVSS gating.

## Requirements-First Execution (Cursor)
- Requirements/specs are the solution. If requirements declare a tool, assume it is installed and use it.
- Do not attempt to “discover” tools or propose alternates. If a tool seems absent, fail fast and report a missing requirement.
- Do not create new tools where established tools exist in the requirements, CI, or `tools/`.
- Always reconcile with `.kiro/specs/**` and `/kiro/spec-status {feature}`; if design/tasks specify tooling, follow them exactly.

## External Sources Registry & Path Capture (Cursor)
- Use `.kiro/steering-custom/external-sources.md` as a registry for reuse and auditability. Paths may use `${FORT_DESKTOP}` to support per-host configuration.
- If the user provides an explicit absolute path, proceed immediately and add it to the registry afterward for future reuse.
- If no path is provided, stop and request the absolute path; do not attempt discovery.
- Treat allowed operations and verification commands as constraints; do not exceed them.
