import csv
import pathlib
import sys
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF

LEMON = Namespace("https://kg.lemon.ai/")

"""
Usage: python3 tools/import_csv_perspectives.py input.csv output.ttl
CSV format: set_id,perspective_uri
Example:
  set1,https://kg.lemon.ai/perspective/finance
  set1,https://kg.lemon.ai/perspective/legal
  set2,https://kg.lemon.ai/perspective/ml
"""

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 tools/import_csv_perspectives.py input.csv output.ttl", file=sys.stderr)
        sys.exit(2)
    in_csv = pathlib.Path(sys.argv[1])
    out_ttl = pathlib.Path(sys.argv[2])
    g = Graph()
    g.bind("lemon", LEMON)
    set_to_uri = {}
    with in_csv.open() as fh:
        reader = csv.DictReader(fh, fieldnames=["set_id", "perspective_uri"])
        for row in reader:
            set_id = row["set_id"].strip()
            puri = row["perspective_uri"].strip()
            set_uri = URIRef(f"https://kg.lemon.ai/perspective-set/{set_id}")
            set_to_uri.setdefault(set_id, set_uri)
            g.add((set_uri, RDF.type, LEMON.PerspectiveSet))
            g.add((URIRef(puri), RDF.type, LEMON.Perspective))
            g.add((set_uri, LEMON.hasMember, URIRef(puri)))
    g.serialize(destination=str(out_ttl), format="turtle")
    print(f"Wrote {out_ttl}")

if __name__ == "__main__":
    main()
