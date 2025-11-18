# Design: Docker Desktop Developer Environment (macOS)

## Overview
Standardize on Docker Desktop for local container runtime and orchestration on macOS (Apple Silicon). Provide clear installation guidance, minimum versions, CLI-first workflows, deterministic orchestration via Compose, and a verification routine with fail-fast errors when prerequisites are unmet. Security and performance recommendations ensure safe, efficient development.

## Goals
- Ensure every developer has a consistent, verified Docker Desktop setup.
- Prefer `docker` and `docker compose` CLI for portability and clarity.
- Enable BuildKit/buildx for fast, reproducible builds.
- Provide deterministic orchestration via Compose files kept in-repo.
- Offer clear verification commands and fail-fast behavior.
- Document secure practices for credentials and privilege.
- Provide performance guidance specific to macOS Apple Silicon.

## Non-Goals
- Replacing Docker Desktop with alternative runtimes.
- Managing production orchestration (Kubernetes, ECS, Nomad), except where a project-specific extension is explicitly approved in a separate spec.

## Target Platform and Minimum Versions
- Docker Desktop: 4.0+
- Docker Engine: 24+
- Docker Compose: v2.0+
- BuildKit/buildx: available and enabled

Verification commands (see Verification section) MUST succeed:
- `docker version`
- `docker info`
- `docker compose version`
- `docker buildx version`

## Components and Architecture
- Docker Desktop (macOS, Apple Silicon):
  - Provides Docker Engine daemon, networking, volumes, Docker Compose v2, and integration UI.
  - Supports BuildKit and buildx for multi-arch and cache-efficient builds.
- Docker Engine:
  - Exposes API used by `docker` CLI and Compose.
  - Registry authentication is delegated to Docker Desktop keychain integrations.
- Docker Compose v2:
  - Orchestrates multi-container apps from YAML manifests.
  - Deterministic local orchestration with explicit services, networks, and volumes.
- BuildKit and buildx:
  - Default build backend for performance and features (cache mounts, secrets).
  - Used via `docker buildx build ...`.
- Volumes and networks:
  - Managed by Docker Desktop; compose declares named volumes and networks explicitly.
- Optional: Docker Desktop MCP and extensions:
  - When approved, developers may install Docker MCP and specific extensions (e.g., Playwright MCP) for project tasks; this remains optional and gated by policy.

## Operational Model
### CLI-First
- Use `docker` and `docker compose` as the canonical interfaces.
- Wrapper scripts may be provided in `tools/` to reduce command drift and encode defaults.

### Orchestration with Compose
- Compose files SHOULD live:
  - In `tools/` for shared, repo-wide services (e.g., `tools/compose/docker-compose.yml`).
  - In project directories when service stacks are scoped (e.g., `apps/api/docker-compose.yml`).
- Compose files MUST declare services, networks, and volumes explicitly for determinism.
- Example commands:

```bash
# Start stack in detached mode
docker compose -f tools/compose/docker-compose.yml up -d

# View logs
docker compose -f tools/compose/docker-compose.yml logs -f --tail=200

# Tear down containers but keep named volumes
docker compose -f tools/compose/docker-compose.yml down
```

### Builds with BuildKit/buildx
- BuildKit SHOULD be enabled by default. Example:

```bash
export DOCKER_BUILDKIT=1
docker buildx version
docker buildx create --use --name beast-builder || docker buildx use beast-builder
docker buildx build --load -t myapp:dev -f Dockerfile .
```

- Use `.dockerignore` to reduce context and avoid sensitive files.
- Prefer multi-stage Dockerfiles to keep runtime images small.

## Verification and Fail-Fast
The repository provides a verification routine (script or Make target) that:
- Confirms installation and versions (minimums enforced).
- Confirms Docker Desktop is running.
- Emits clear error messages and stops if prerequisites are unmet.

Baseline commands the verifier runs:

```bash
docker version
docker info
docker compose version
docker buildx version
```

Fail-fast guidance:
- If Docker Desktop is NOT installed: exit non-zero with a message: "Docker Desktop 4.0+ is required. Install from docker.com and re-run verification."
- If Docker Desktop is NOT running: exit non-zero with a message: "Docker Desktop is installed but not running. Please start Docker Desktop and re-run verification."
- Do NOT suggest alternate runtimes unless explicitly required by this spec.

## Security Practices
- Do not bake credentials into images. Use:
  - Build secrets via BuildKit (`--secret id=...` and `RUN --mount=type=secret`).
  - Runtime environment files (`--env-file`) for local development.
  - Docker secrets where applicable (Compose v3.7+; note local limitations).
- Enforce `.dockerignore` to exclude sensitive files (e.g., `.env`, key material).
- Privileged containers require explicit justification in the spec; default to least privilege.
- Use non-root user in containers where possible; document exceptions.

## Performance Guidance (macOS Apple Silicon)
- Resource limits in Docker Desktop:
  - Recommended starting point for this repository: 4 CPUs, 6–8 GB RAM, 2 GB swap (adjust per workload).
  - Document project-specific overrides where heavier services (e.g., databases) are used.
- Enable BuildKit and leverage cache mounts to speed up dependency-heavy layers.
- Prefer volumes over bind mounts for high I/O paths when feasible.
- Be aware of Apple Virtualization framework overhead; large file-watcher workloads may require tuned excludes.
- Consider multi-arch implications; on Apple Silicon, prefer `linux/arm64` for local builds unless x86_64 is required.

## Repository Conventions
- Compose manifests:
  - Shared: `tools/compose/docker-compose.yml` (and overrides like `docker-compose.override.yml`).
  - Scoped: `*/docker-compose.yml` within specific projects/apps.
- Wrapper scripts (optional but recommended) in `tools/`:
  - `tools/dev-up.sh` (bring-up common stack)
  - `tools/dev-down.sh` (tear down)
  - `tools/dev-build.sh` (build images with buildx)
  - Scripts MUST be non-interactive and fail-fast with clear messages.

## MCP Integration (Optional)
- When approved, document:
  - Install steps for Docker MCP on macOS.
  - Extension-specific setup (e.g., Playwright MCP) and minimal verification command(s).
  - Clear tagging as optional; no gating on base verification.

## Risks and Mitigations
- Privileged containers: restrict usage; justify explicitly and isolate to minimal scope.
- Secrets sprawl: centralize env files, prefer BuildKit secrets; never commit secrets.
- Performance regressions: monitor with `docker stats` and adjust Desktop resource settings.

## Requirement-to-Design Mapping (Traceability)
- Requirement 1 (Installation): Desktop 4.0+ on macOS; verification detects install/run state and fails fast.
- Requirement 2 (Core capabilities): Engine API, Compose v2, BuildKit/buildx, registry auth, volumes/networks covered in Components and Operational Model.
- Requirement 3 (CLI preference): CLI-first section mandates `docker` and `docker compose`; wrappers optional.
- Requirement 4 (Version documentation): Minimum versions listed; verification commands enumerated.
- Requirement 5 (Orchestration guidance): Compose file locations and deterministic orchestration defined; wrapper scripts noted.
- Requirement 6 (Security practices): Secrets handling, `.dockerignore`, privilege guidance documented.
- Requirement 7 (Performance): Desktop resource recommendations and Apple virtualization considerations provided.
- Requirement 8 (Fail-fast policy): Explicit failure messages and no alternative runtime suggestion.
- Requirement 9 (MCP optional): Optional MCP/extension flow documented with verification note.

## Appendix: Command Cheat Sheet

```bash
# Versions
docker version && docker compose version && docker buildx version

# Engine health
docker info

# Build (with BuildKit)
DOCKER_BUILDKIT=1 docker buildx build --load -t myapp:dev .

# Compose up/down
docker compose -f tools/compose/docker-compose.yml up -d
docker compose -f tools/compose/docker-compose.yml down
```
