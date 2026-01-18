import pathlib
from rdflib import Graph
from pyshacl import validate

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHAPES = ROOT / "shapes"
BUILD = ROOT / "build"
DATAFILE = BUILD / "words-v1.ttl"

def main() -> None:
    if not DATAFILE.exists():
        raise SystemExit("Run tools/assemble.py first")
    data_graph = Graph().parse(str(DATAFILE), format="turtle")
    shapes_graph = Graph()
    for ttl in sorted(SHAPES.glob("*.ttl")):
        shapes_graph.parse(str(ttl), format="turtle")
    conforms, report_graph, report_text = validate(
        data_graph,
        shacl_graph=shapes_graph,
        inference='rdfs',
        abort_on_first=False,
        meta_shacl=False,
        advanced=True,
        js=False,
    )
    pathlib.Path("build/shacl-report.txt").write_text(report_text)
    print(report_text)
    if not conforms:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
