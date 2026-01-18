import sys
from pathlib import Path
from typing import Iterable, Tuple

from rdflib import Graph


TARGET_DIRS = ("ontology", "shapes", "mappings", "build")
EXT_TO_FORMAT = {
    ".ttl": "turtle",
    ".trig": "trig",
    ".nt": "nt",
    ".nq": "nquads",
}


def iter_rdf_files() -> Iterable[Tuple[Path, str]]:
    repo_root = Path(".").resolve()
    for rel_dir in TARGET_DIRS:
        base_dir = repo_root / rel_dir
        if not base_dir.is_dir():
            continue
        for path in sorted(base_dir.rglob("*")):
            if not path.is_file():
                continue
            fmt = EXT_TO_FORMAT.get(path.suffix.lower())
            if fmt:
                yield (path, fmt)


def main() -> int:
    num_files = 0
    num_errors = 0
    for path, fmt in iter_rdf_files():
        num_files += 1
        try:
            Graph().parse(str(path), format=fmt)
            print(f"OK [{fmt}]: {path}")
        except Exception as exc:
            num_errors += 1
            print(f"ERR [{fmt}]: {path}: {exc}", file=sys.stderr)
    if num_files == 0:
        print("No RDF files found in target directories (ontology, shapes, mappings, build).")
        return 0
    if num_errors > 0:
        print(f"Validation failed: {num_errors} file(s) errored out of {num_files}.", file=sys.stderr)
        return 1
    print(f"Validation passed: {num_files} file(s) checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


