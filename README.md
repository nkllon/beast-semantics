Lemon-KG: Research-centered ontology and SHACL

- ontology: OWL/Turtle modules (core, diversity, energy, context, align)
- shapes: SHACL shapes for validation
- data: Example instances (hypotheses)
- queries: SPARQL queries for analysis
- mappings: Per-project mappings to Lemon-KG
- tools: Python tooling (rdflib, pyshacl, loaders, metrics)
- graphdb: Helper scripts and notes for GraphDB

Quick start
1) Assemble all ontology and data into build/lemon-kg.ttl
   - python3 tools/assemble.py
2) Validate with SHACL
   - python3 tools/validate.py
3) Load to GraphDB (env GRAPHDB_URL, REPO_ID)
   - ./graphdb/load.sh build/lemon-kg.ttl

## Using bundled cc-sdd (local, no upstream changes)

Prereqs: Node 18+

```bash
# Run the vendored CLI in this repo only
./tools/vendor/cc-sdd/dist/cli.js \
  --agent cursor \
  --profile minimal \
  --yes \
  --overwrite skip \
  --backup="/tmp/cc-sdd-backup"
```

Outputs here (safe):
- .cursor/commands/kiro/*
- .kiro/settings/*
- AGENTS.md

### Verification

After installation (or on fresh clones), verify the setup:

```bash
./tools/verify-cc-sdd.sh
```

The script checks:
- Node.js version (>= 18)
- Presence of Kiro commands (11 files) at `.cursor/commands/kiro/`
- Settings structure at `.kiro/settings/`
- `AGENTS.md` presence

### Troubleshooting

- Node.js 18+ required:
  - Install or switch with nvm: `nvm install 18 && nvm use 18`
  - Verify: `node -v` (should be v18 or higher)
- Missing Kiro command files or settings:
  - Re-run the vendored CLI from this repo root (safe, local-only):
    ```bash
    ./tools/vendor/cc-sdd/dist/cli.js \
      --agent cursor \
      --profile minimal \
      --yes \
      --overwrite skip \
      --backup="/tmp/cc-sdd-backup"
    ```
- Release verification mismatches:
  - Ensure files in `build/releases/<version>/` haven't been edited
  - Recreate the snapshot: `./tools/release-freeze.sh <version>`
  - Re-verify: `./tools/verify-release.sh <version>`
- General tips:
  - Run commands from the repository root
  - Ensure `shasum` (macOS) or `sha256sum` is available for checksum steps

## Release Freeze (Immutable Snapshot)

Create a versioned, immutable snapshot with dual-hash manifests and SBOM:

```bash
# Freeze snapshot into build/releases/<version>/
./tools/release-freeze.sh 1.2.3

# Verify snapshot (SHA-256 and MD5)
./tools/verify-release.sh 1.2.3

# CC-SDD + release verification in one step
./tools/verify-cc-sdd.sh --release 1.2.3
```

What it produces:
- `build/releases/1.2.3/MANIFEST.sha256` (primary)
- `build/releases/1.2.3/MANIFEST.md5` (compatibility)
- `build/releases/1.2.3/release.label` (human-friendly label)
- `build/releases/1.2.3/sbom.cdx.json` (CycloneDX, best-effort)
- Curated artifacts: CC‑SDD setup plus domain build outputs (`build/*.ttl`, `build/shacl-*.txt`)

Update the vendor snapshot later (optional):

```bash
# Refresh from your local cc-sdd clone (keeps upstream untouched)
rsync -a /Volumes/lemon/cursor/cc-sdd/tools/cc-sdd/dist/ tools/vendor/cc-sdd/dist/
rsync -a /Volumes/lemon/cursor/cc-sdd/tools/cc-sdd/templates/ tools/vendor/cc-sdd/templates/
```

Guardrails:
- Do not modify upstream cc-sdd here.
- Commit the vendored tree if you refresh it, so CI is reproducible.

## CI Gates (OSS RDF/SPARQL QA)

This repository includes a GitHub Actions workflow that validates RDF/TTL/SPARQL and runs security gates:

- RDF syntax validation: Apache Jena RIOT (`riot --validate`) over `ontology/`, `shapes/`, `mappings/`, `build/`
- RDF lint: `rdflint` (Fatal/Error fail; style-level warnings do not fail)
- SPARQL parsing/formatting: `tools/sparql_check.mjs` on `queries/**/*.rq`
  - Parse errors fail the job
  - Formatting drift is a warning by default
  - To enforce formatting as errors, set environment variable `ENFORCE_SPQ_FORMAT=true`
- Secrets scanning: `gitleaks` with `--redact`
- Python dependency scanning: `pip-audit` (fails on CVSS ≥ 7.0)
- Domain metric (baseline): simple diversity metric over query name prefixes; fails on regression

A concise pass/fail summary is written to the GitHub Actions Job Summary. All action versions and tool installs are pinned for reproducibility, and Node installs use `--no-fund --no-audit`.

Remediation tips:
- RIOT failures: fix TTL/TriG/N-Triples/N-Quads syntax at the reported file:line:column
- rdflint Fatal/Error: address structural issues; style warnings are advisory
- SPARQL parse errors: correct syntax where the error points; run `tools/sparql_check.mjs queries` locally
- Secrets: remove and rotate any leaked credentials; amend history if needed
- pip-audit High/Critical: upgrade affected packages; re-run audit

