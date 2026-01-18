# Engineering Tech Steering: CI & Code Quality

## CI/CD
- GitHub Actions is the primary CI runner.
- Keep CI logs and PR UIs free of proprietary “Pro/Trial” upsell prompts.
- Only add CI steps for tools with OSI-approved licenses unless they are org-approved services (e.g., SonarCloud).

## Code Quality
- Default: SonarCloud handles analysis and PR decoration for this repository.
- Do not introduce parallel proprietary review bots. If duplication occurs, remove the nonstandard bot.
- If SonarCloud cannot be used, prefer OSS replacements:
  - SonarQube Community (self-hosted)
  - reviewdog + native linters

## Implementation Notes
- Prefer a single, authoritative PR check (SonarCloud) to avoid noise.
- If encountering a non-OSS bot:
  - Remove workflow files/steps that reference it.
  - Uninstall its GitHub App.
  - Verify SonarCloud remains green/red gate.

## Vendor Strategy & Exit
- Do not develop or maintain SonarQube plugins in-house unless explicitly prioritized and funded.
- Prefer external OSS linters and validators wired into CI (via reviewdog) over server-side plugins.
- Maintain an exit path to an OSS-only pipeline with equivalent PR gates if SonarCloud’s free-OSS terms change.

## Tooling Policy (Authoritative)
- Use the Tool Selection Matrix in `AGENTS.md` as the source of truth for which tool to use.
- Prefer `gh` for GitHub operations; use `gh api` for endpoints not covered by high-level commands.
- Use `git` for repository operations; do not reimplement git behavior via APIs.
- Use repo-provided scripts under `tools/` instead of duplicating logic in new scripts or workflows.
- Do not “discover” or propose installing alternative tools unless requirements explicitly direct it.

## Requirements-First Execution (Fail-Fast)
- Requirements/specs are the operational source of truth. If a tool is specified, assume it is installed and use it.
- If a tool appears unavailable at runtime, fail fast and flag a missing or outdated requirement; do not invent a workaround.
- Follow designs/tasks as documented in `.kiro/specs/**`; deviations must be addressed by updating the spec, not by ad-hoc changes.

## Local-First Parity (Mandatory)
- Any tool used in CI MUST be runnable locally in the lab with the same flags before merging.
- If a CI step cannot be executed locally, replace it or add a local runner wrapper under `tools/` to ensure parity.
- Prefer hermetic installs (language package managers or pinned release binaries in `tools/bin/`) over system-wide installs.

## External Sources Registry
- Agents may read external directories when `${FORT_DESKTOP}` is set, when an explicit absolute path is provided by the user, or when listed in `.kiro/steering-custom/external-sources.md`.
- If no path is provided and `${FORT_DESKTOP}` is unset, request it; add paths to the registry after use for reuse/audit. Do not attempt discovery outside explicit user input or the registry.


