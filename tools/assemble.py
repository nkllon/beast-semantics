import pathlib
from rdflib import Graph

ROOT = pathlib.Path(__file__).resolve().parents[1]
ONTO = ROOT / "ontology"
DATA = ROOT / "data"
BUILD = ROOT / "build"

MODULES = [
    "lemon-core.ttl",
    "lemon-diversity.ttl",
    "lemon-energy.ttl",
    "lemon-context.ttl",
    "lemon-align.ttl",
]

def main() -> None:
    BUILD.mkdir(exist_ok=True)
    g = Graph()
    for name in MODULES:
        g.parse(ONTO / name, format="turtle")
    for ttl in sorted(DATA.glob("*.ttl")):
        g.parse(ttl, format="turtle")
    out = BUILD / "lemon-kg.ttl"
    g.serialize(destination=str(out), format="turtle")
    print(f"Wrote {out}")

if __name__ == "__main__":
    main()
