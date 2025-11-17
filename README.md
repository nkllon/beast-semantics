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
