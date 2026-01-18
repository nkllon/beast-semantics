#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import os
from pathlib import Path
from typing import Iterable, Set, Tuple

from rdflib import BNode, Graph, Literal, Namespace, URIRef
from rdflib.namespace import DCTERMS, OWL, RDF, RDFS, XSD


ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = ROOT / "build"
DEFAULT_INPUT = BUILD_DIR / "words-v1.ttl"
DEFAULT_OUT_DIR = BUILD_DIR / "metadata"
DEFAULT_OUT_PATH = DEFAULT_OUT_DIR / "void.ttl"

# Namespaces
VOID = Namespace("http://rdfs.org/ns/void#")
DCAT = Namespace("http://www.w3.org/ns/dcat#")
PROV = Namespace("http://www.w3.org/ns/prov#")


def read_git_commit(repo_root: Path) -> str:
	"""Return current git commit hash, or empty string if not a git repo."""
	head_ref = repo_root / ".git" / "HEAD"
	try:
		# Fast path: resolve HEAD ref manually if possible to avoid spawning a process
		if head_ref.exists():
			head = head_ref.read_text(encoding="utf-8").strip()
			if head.startswith("ref:"):
				ref_path = head.split(" ", 1)[1].strip()
				ref_file = repo_root / ".git" / ref_path
				if ref_file.exists():
					return ref_file.read_text(encoding="utf-8").strip()
			# Detached HEAD with hash in HEAD itself
			if len(head) >= 7 and all(c in "0123456789abcdef" for c in head[:7].lower()):
				return head
	except Exception:
		pass
	# Fallback to environment (e.g., CI) or empty
	return os.environ.get("GITHUB_SHA", "")


def sha256_file(path: Path) -> str:
	h = hashlib.sha256()
	with path.open("rb") as f:
		for chunk in iter(lambda: f.read(1024 * 1024), b""):
			h.update(chunk)
	return h.hexdigest()


def collect_vocabularies(graph: Graph) -> Set[str]:
	"""Collect a set of vocabulary namespace IRIs used in the graph."""
	namespaces: Set[str] = set()
	skip_prefixes = {"http://www.w3.org/2001/XMLSchema#", str(RDF), str(RDFS), str(OWL)}
	for s, p, o in graph:
		# Predicates are most indicative of vocabularies
		if isinstance(p, URIRef):
			ns = str(p)[: str(p).rfind("/") + 1] if "/" in str(p) else str(p)
			# For hash-based namespaces
			if "#" in str(p):
				ns = str(p)[: str(p).rfind("#") + 1]
			if ns and ns not in skip_prefixes:
				namespaces.add(ns)
	# Also include subjects that look like vocab terms (defined classes/properties)
	for subj in graph.subjects(RDF.type, OWL.Class):
		if isinstance(subj, URIRef):
			u = str(subj)
			ns = u[: u.rfind("/") + 1] if "/" in u else u
			if "#" in u:
				ns = u[: u.rfind("#") + 1]
			if ns:
				namespaces.add(ns)
	for subj in graph.subjects(RDF.type, RDF.Property):
		if isinstance(subj, URIRef):
			u = str(subj)
			ns = u[: u.rfind("/") + 1] if "/" in u else u
			if "#" in u:
				ns = u[: u.rfind("#") + 1]
			if ns:
				namespaces.add(ns)
	for subj in graph.subjects(RDF.type, OWL.ObjectProperty):
		if isinstance(subj, URIRef):
			u = str(subj)
			ns = u[: u.rfind("/") + 1] if "/" in u else u
			if "#" in u:
				ns = u[: u.rfind("#") + 1]
			if ns:
				namespaces.add(ns)
	for subj in graph.subjects(RDF.type, OWL.DatatypeProperty):
		if isinstance(subj, URIRef):
			u = str(subj)
			ns = u[: u.rfind("/") + 1] if "/" in u else u
			if "#" in u:
				ns = u[: u.rfind("#") + 1]
			if ns:
				namespaces.add(ns)
	return namespaces


def count_terms(graph: Graph) -> Tuple[int, int, int]:
	"""Return (num_classes, num_properties, num_entities) for the graph."""
	classes: Set[URIRef] = set()
	props: Set[URIRef] = set()
	entities: Set[URIRef] = set()

	for c in graph.subjects(RDF.type, OWL.Class):
		if isinstance(c, URIRef):
			classes.add(c)
	for c in graph.subjects(RDF.type, RDFS.Class):
		if isinstance(c, URIRef):
			classes.add(c)

	for p in graph.subjects(RDF.type, RDF.Property):
		if isinstance(p, URIRef):
			props.add(p)
	for p in graph.subjects(RDF.type, OWL.ObjectProperty):
		if isinstance(p, URIRef):
			props.add(p)
	for p in graph.subjects(RDF.type, OWL.DatatypeProperty):
		if isinstance(p, URIRef):
			props.add(p)

	# Entities approximated as distinct URI subjects
	for s, _, _ in graph:
		if isinstance(s, URIRef):
			entities.add(s)

	return (len(classes), len(props), len(entities))


def generate_metadata(input_path: Path, out_path: Path) -> Path:
	"""Generate VoID/DCAT metadata for the given dataset."""
	if not input_path.exists():
		raise FileNotFoundError(f"Input TTL not found: {input_path}")

	data_graph = Graph()
	data_graph.parse(str(input_path), format="turtle")

	out_graph = Graph()
	# Bind prefixes deterministically
	out_graph.bind("dcterms", DCTERMS)
	out_graph.bind("dcat", DCAT)
	out_graph.bind("void", VOID)
	out_graph.bind("prov", PROV)
	out_graph.bind("owl", OWL)
	out_graph.bind("rdf", RDF)
	out_graph.bind("rdfs", RDFS)
	out_graph.bind("xsd", XSD)

	# Deterministic dataset IRI based on content hash
	content_sha = sha256_file(input_path)
	dataset_iri = URIRef(f"urn:sha256:{content_sha}")
	activity = BNode()

	now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
	commit = read_git_commit(ROOT)

	triples_count = len(data_graph)
	num_classes, num_properties, num_entities = count_terms(data_graph)
	vocabularies = sorted(collect_vocabularies(data_graph))

	# Dataset as both DCAT and VoID
	out_graph.add((dataset_iri, RDF.type, DCAT.Dataset))
	out_graph.add((dataset_iri, RDF.type, VOID.Dataset))

	# Minimal descriptive fields (can be enriched by upstream build)
	out_graph.add((dataset_iri, DCTERMS.title, Literal("Assembled ontology dataset")))
	out_graph.add(
		(dataset_iri, DCTERMS.description, Literal("Unified ontology and data graph assembled from repo modules."))
	)
	out_graph.add((dataset_iri, DCTERMS.issued, Literal(now, datatype=XSD.dateTime)))
	if commit:
		out_graph.add((dataset_iri, DCTERMS.hasVersion, Literal(commit)))

	# VoID statistics
	out_graph.add((dataset_iri, VOID.triples, Literal(triples_count, datatype=XSD.integer)))
	out_graph.add((dataset_iri, VOID.classes, Literal(num_classes, datatype=XSD.integer)))
	out_graph.add((dataset_iri, VOID.properties, Literal(num_properties, datatype=XSD.integer)))
	out_graph.add((dataset_iri, VOID.entities, Literal(num_entities, datatype=XSD.integer)))
	for ns in vocabularies:
		out_graph.add((dataset_iri, VOID.vocabulary, URIRef(ns)))

	# Provenance
	out_graph.add((activity, RDF.type, PROV.Activity))
	out_graph.add((activity, PROV.startedAtTime, Literal(now, datatype=XSD.dateTime)))
	out_graph.add((dataset_iri, PROV.wasGeneratedBy, activity))

	# Ensure output directory exists
	out_path.parent.mkdir(parents=True, exist_ok=True)
	out_graph.serialize(destination=str(out_path), format="turtle")
	return out_path


def main() -> int:
	parser = argparse.ArgumentParser(description="Generate VoID/DCAT metadata for the assembled ontology dataset.")
	parser.add_argument("--in", dest="input", default=str(DEFAULT_INPUT), help="Input Turtle file (assembled graph)")
	parser.add_argument("--out", dest="output", default=str(DEFAULT_OUT_PATH), help="Output VoID/DCAT Turtle file")
	args = parser.parse_args()

	input_path = Path(args.input).resolve()
	out_path = Path(args.output).resolve()

	try:
		result = generate_metadata(input_path, out_path)
	except Exception as exc:
		print(f"Metadata generation failed: {exc}")
		return 1
	print(f"Wrote {result}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())


