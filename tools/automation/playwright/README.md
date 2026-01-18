# Governance Automation (Playwright)

Scaffold for admin-only automation that prefers GitHub API first and uses UI automation as fallback.

Setup:
- Node.js 18+
- Install browsers on first run: `npx --yes playwright install --with-deps`

Scripts:
- Build: `npm run build`
- Test: `npm test`
- Start (CLI): `npm start`
- Codegen helper: `npm run codegen`

Artifacts:
- Screenshots/traces are stored under `test-results/` by default

MCP runtime (Docker):
- This repo includes a Dockerized Playwright MCP server based on `@playwright/mcp`.
- Build and run:
  - Build image: `docker compose -f tools/runtime/docker-compose.yml build playwright-mcp`
  - Start (help): `docker compose -f tools/runtime/docker-compose.yml run --rm playwright-mcp --help`
  - Mounts the workspace at `/work` and writes artifacts under `tools/runtime/artifacts/`.
  - Reference: Microsoft Playwright MCP server [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp/tree/8cc557d677f4a1196d12e1c479857dd39796226c)


