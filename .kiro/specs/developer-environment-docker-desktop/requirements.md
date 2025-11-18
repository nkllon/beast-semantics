# Requirements — Developer Environment: Docker Desktop

- R1: Docker Desktop is a required developer tool on macOS (Apple Silicon supported). It must be installed and running during local development.
- R2: Provide Docker Engine API, BuildKit/buildx, Docker Compose v2 (`docker compose`), image registry auth, volumes, and networking.
- R3: Prefer `docker`/`docker compose` CLIs for containerized workflows; do not introduce alternative runtimes unless explicitly required by spec.
- R4: Document minimum versions and verification commands (`docker version`, `docker info`, `docker compose version`, `docker buildx version`).
- R5: Provide deterministic local orchestration guidance using Compose files under `tools/` or project directories.
- R6: Security: do not store credentials in images; use env files/secrets; avoid privileged containers unless required by spec.
- R7: Performance: recommend resource limits (CPU/RAM) suitable for the repository setup; document Apple Virtualization framework notes.
- R8: Fallback policy: if Docker Desktop is unavailable, fail fast and escalate missing requirement rather than proposing alternatives.

## MCP Facility
- R9: Evaluate and, if approved, document Docker Desktop MCP installation for Playwright as an optional, supported runtime.
- R10: Provide verification commands for MCP presence and Playwright MCP availability.

