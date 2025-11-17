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

Update the vendor snapshot later (optional):

```bash
# Refresh from your local cc-sdd clone (keeps upstream untouched)
rsync -a /Volumes/lemon/cursor/cc-sdd/tools/cc-sdd/dist/ tools/vendor/cc-sdd/dist/
rsync -a /Volumes/lemon/cursor/cc-sdd/tools/cc-sdd/templates/ tools/vendor/cc-sdd/templates/
```

Guardrails:
- Do not modify upstream cc-sdd here.
- Commit the vendored tree if you refresh it, so CI is reproducible.

