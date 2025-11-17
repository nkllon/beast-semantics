GraphDB loading

Prereqs
- GraphDB running (e.g., on herbert/vonnegut) and repository created (REPO_ID)
- Environment variables: GRAPHDB_URL, REPO_ID

Commands
- Assemble ontology + data: `python3 tools/assemble.py`
- Validate with SHACL: `python3 tools/validate.py`
- Load: `./graphdb/load.sh build/lemon-kg.ttl`

SHACL in GraphDB
- Optionally enable SHACL validation in repo settings.
- Import `shapes/*.ttl` into a dedicated SHACL graph or load alongside data.
