# OSS Evaluation Matrix (initial)

Scored 1–5 (5 best) against criteria C1–C7 from `.kiro/specs/oss-alignment/requirements.md`.

| Project | C1 License/Gov | C2 Arch Fit | C3 Determinism | C4 Perf/Eff | C5 Extensibility | C6 Interop | C7 Security | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Comunica + GraphQL‑LD | 5 | 4 | 3 | 4 | 5 | 5 | 4 | Great federation; determinism relies on sources and context conventions |
| HyperGraphQL | 4 | 4 | 3 | 4 | 4 | 4 | 4 | Config‑driven; needs clearer persisted query/limits patterns |
| Oxigraph | 5 | 4 | 4 | 5 | 4 | 4 | 4 | Strong engine in Rust; ecosystem maturity improving |
| rdflib + pySHACL | 5 | 3 | 4 | 3 | 4 | 5 | 4 | Excellent for ETL/validation; not a production server |
| jsonld.js / pyLODE / rdflint | 5 | 4 | 4 | 4 | 3 | 5 | 4 | Complements publishing and CI gates |
| sparqljs | 5 | 4 | 4 | 4 | 4 | 4 | 4 | Solid parser/formatter; enables CI checks and tooling |

Shortlist (initial): Comunica/GraphQL‑LD, Oxigraph, HyperGraphQL.


