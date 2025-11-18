# Agent Steering: Code Quality & Tooling

## Defaults
- SonarCloud is the organization-approved code quality and PR check provider for this repository.
- Do not ask the user to choose between alternatives when the obvious, in-repo standard exists (SonarCloud). Proceed with SonarCloud by default.

## Policy
- Disallow proprietary PR bots and upsell banners in CI/CD (e.g., “Pro” trials). If a tool lacks an OSI-approved open-source license for core usage in CI, do not add it.
- Exceptions are only for already organization-approved services (e.g., SonarCloud) and must not introduce vendor upsell prompts into CI logs or PR UIs.
- If SonarCloud is unavailable or broken, prefer open-source options:
  - SonarQube Community (self-hosted, OSS) as the closest functional alternative.
  - Or reviewdog + native linters (ESLint, Ruff/Flake8, golangci-lint, ShellCheck, etc.).

## Behavior
- Default to SonarCloud for code quality discussions, tasks, and PR decorations in this repo.
- Avoid “What do you prefer?” questions where the choice is obvious from repository context.
- If removal is needed for a non-OSS bot:
  1) Remove its workflow steps/files.
  2) Uninstall the GitHub App/integration at org/repo scope.
  3) Ensure SonarCloud remains the single source of PR quality feedback.

## Ecosystem Strategy
- Deprioritize investment in the SonarQube plugin ecosystem. We will not build or maintain SonarQube plugins unless there is a compelling, funded need.
- Use SonarCloud for OSS scanning while free for public repositories. Avoid sunk cost in vendor-specific plugin development.
- Focus team effort on OSS, tool-agnostic checks (RDF/TTL/SPARQL linters, secrets scanning, SCA, SBOM policy, domain metrics) that remain valuable regardless of vendor.

## Fallback Plan (if SonarCloud terms or availability change)
1) Disable SonarCloud checks and switch to an OSS-only PR gate:
   - reviewdog for PR annotations
   - Apache Jena RIOT for RDF/Turtle validation
   - SPARQL linters/formatters for `.rq`
   - gitleaks for secrets
   - pip-audit (or safety) for Python SCA
   - CycloneDX SBOM + policy gate (CVEs/license)
   - Enforce domain metrics thresholds (e.g., `tools/metrics_diversity.py`)
2) Optionally evaluate SonarQube Community strictly as a viewer for main-branch trends (no PR decoration) if needed; do not invest in custom plugins.


