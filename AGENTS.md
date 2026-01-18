# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in English

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
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)

## Tooling Policy (use the right tool; no ad-hoc tool creation)
- Prefer existing, project-standard tools. Do not create new tools when equivalents exist.
- Assume `gh` (GitHub CLI) is installed and authenticated. Do not ask to install it. If truly unavailable, fail fast with an explicit instruction.
- For GitHub endpoints not covered by high-level commands, use `gh api` (not raw `curl`) to reach REST/GraphQL.
- Use `git` for repository operations (log, diff, status). Never reimplement with API calls.
- Use repo scripts in `tools/` where available; do not duplicate their logic.
- Do not “discover” or propose installing alternative tools without explicit direction.

## Tool Selection Matrix (authoritative)
- GitHub PRs/Issues/Reviews/Metadata: use `gh` (`gh pr list/view/create`, `gh issue ...`, `gh repo view`, `gh pr checks`, etc.).
- Arbitrary GitHub API data: use `gh api` with `--jq/--paginate` as needed.
- Git operations: use `git` CLI.
- SPARQL parsing/formatting/validation: run `node tools/sparql_check.mjs queries`.
- RDF validation (syntax/semantics): prefer Apache Jena RIOT (`riot --validate`), matching CI.
- RDF linting (style/quality): use `rdflint` (as in CI).
- TTL quick parse (local only): `python tools/lint_ttl.py` (fallback; not a replacement for RIOT/rdflint).
- Secrets scanning: `gitleaks` (as in CI).
- Python dependency audit: `pip-audit` with CVSS gating (as in CI).
- Diversity metrics: import `tools/metrics_diversity.py` rather than re-implementing.

## Requirements-First Execution and Fail-Fast Policy
- Treat requirements/specs as the operational source of truth. If requirements state a tool must be available, assume it is available.
- Do not perform runtime “tool discovery” or propose ad-hoc installations. If a tool appears missing, fail fast and flag a missing requirement.
- Do not invent alternate solutions when a requirement is unmet; escalate to update the requirement/spec instead.
- Verify alignment with `.kiro/specs/**` and `/kiro/spec-status {feature}` before attempting work; if the design/tasks indicate a tool path, use it.

## External Sources Registry & Path Capture Protocol
- External directories/repos can be declared in `.kiro/steering-custom/external-sources.md` for reuse and auditability.
- If the user provides an explicit absolute path in the request, proceed immediately; record it in the registry afterward for future reuse.
- If no path is provided, fail fast and request the absolute path (do not attempt discovery).
- Once recorded, reuse the path without re-asking. Never “discover” paths outside explicit user input or the registry.
- Allowed operations should be explicit (read-only by default). Honor verification commands before scanning.

## Fort Desktop Reuse Policy (Hard Rule)
- Before any design or implementation work, check the Fort desktop for existing, approved implementations to reuse.
- Path resolution: use `${FORT_DESKTOP}` if set; otherwise use the recorded path in `.kiro/steering-custom/external-sources.md`; if neither is available, request the absolute path and record it.
- If the Fort path is unavailable, fail fast and escalate; do not proceed by re‑implementing.
- Document any reused components in the spec/tasks and reference the originating repo/commit.
