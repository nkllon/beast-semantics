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

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Version requirement satisfaction
*For any* Docker Desktop installation that passes verification, the Docker Engine version should be >= 24 and Compose should be v2.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 2: CLI command availability
*For any* verified Docker Desktop installation, the commands `docker`, `docker compose`, and `docker buildx` should all be executable and return version information.
**Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.2**

### Property 3: Fail-fast on unavailability
*For any* system where Docker Desktop is not running, verification should fail with exit code non-zero and provide a clear error message.
**Validates: Requirements 8.1, 8.2, 8.3**

## Testing Strategy

### Unit Testing
- **Version parsing**: Test extraction of version numbers from CLI output
- **Command availability**: Test detection of missing Docker commands
- **Error messages**: Verify clarity and actionability of failure messages

### Property-Based Testing
- **Property 1 (Version requirements)**: Run verification on systems with various Docker versions, verify correct pass/fail
- **Property 2 (CLI availability)**: Test with various PATH configurations, verify all required commands detected
- **Property 3 (Fail-fast)**: Simulate Docker Desktop stopped/missing, verify appropriate failure

### Integration Testing
- **Fresh installation**: Test verification on newly installed Docker Desktop
- **Compose files**: Test sample multi-container setup with provided Compose files
- **MCP detection**: Test MCP presence detection when available

