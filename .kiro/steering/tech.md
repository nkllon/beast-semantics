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


