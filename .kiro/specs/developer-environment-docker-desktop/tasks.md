# Tasks — Developer Environment: Docker Desktop

1. Document Docker Desktop requirement
   - Update `AGENTS.md`, Cursor agent docs, and steering to declare Docker Desktop as required.
   - Include verification commands and minimum versions.

2. Compose integration
   - Add or standardize `docker-compose.yml` locations under `tools/` or service directories.
   - Provide wrapper scripts in `tools/` for common workflows.

3. Optional verification
   - Add `tools/verify-docker.sh` to print versions and confirm Engine/Compose/Buildx availability.

4. Security and performance notes
   - Document secrets handling and recommended resource limits for macOS.

