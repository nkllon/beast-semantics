#!/usr/bin/env python3
import sys

def main() -> int:
	try:
		import rdflib  # noqa: F401
	except Exception:
		print("formats skipped: rdflib not installed")
		return 0
	# Optional: pyLODE may be missing; keep offline-friendly
	try:
		import pylode  # type: ignore # noqa: F401
	except Exception:
		print("formats skipped: pyLODE not installed")
		return 0
	# If both are present, this is where conversion would run.
	print("formats skipped: conversions not implemented yet")
	return 0

if __name__ == "__main__":
	sys.exit(main())


