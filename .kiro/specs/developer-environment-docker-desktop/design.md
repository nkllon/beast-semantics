# Design — Developer Environment: Docker Desktop

## Purpose
Establish Docker Desktop as the standard local container runtime and orchestration layer for development on macOS. Define the minimal capabilities, verification steps, and how project tooling integrates with Docker and Compose.

## Capabilities
- Docker Engine API and BuildKit for efficient builds.
- Docker Compose v2 for multi-service orchestration.
- Buildx for cross-platform builds when needed.
- Local image registry auth passthrough.
- Volumes and bridged networking for services.

## Integration
- Prefer repository-provided `docker-compose.yml` files under `tools/` or service directories.
- Commands are scripted in `tools/` where possible to avoid drift.
- Verification script (optional) under `tools/verify-docker.sh` to check versions and features.

## Versioning
- Minimum Docker Desktop version: 4.x (Engine >= 24, Compose v2).
- Apple Silicon support validated.

## Determinism
- If Docker Desktop is not present/running, all containerized workflows fail fast with a clear message directing to requirements.

## MCP Integration (Optional)
- Document how to enable Docker Desktop MCPs and verify Playwright MCP availability.
- Provide a simple wrapper to invoke the Playwright MCP with bind-mounted workspace and env secrets, aligning artifacts under `build/`.

