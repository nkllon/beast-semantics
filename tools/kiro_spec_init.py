#!/usr/bin/env python3
import sys
import os
import re
from datetime import datetime

KIRO_DIR = ".kiro"
TEMPLATES_DIR = os.path.join(KIRO_DIR, "settings", "templates", "specs")
INIT_JSON_TEMPLATE = os.path.join(TEMPLATES_DIR, "init.json")
REQ_INIT_TEMPLATE = os.path.join(TEMPLATES_DIR, "requirements-init.md")


def slugify(text: str) -> str:
	# Lowercase, replace non-alphanumerics with dashes, collapse repeats, strip dashes
	slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower())
	slug = re.sub(r"-{2,}", "-", slug).strip("-")
	return slug or "feature"


def ensure_unique_feature_name(base_name: str, specs_root: str) -> str:
	name = base_name
	n = 2
	while os.path.exists(os.path.join(specs_root, name)):
		name = f"{base_name}-{n}"
		n += 1
	return name


def read_text(path: str) -> str:
	with open(path, "r", encoding="utf-8") as f:
		return f.read()


def write_text(path: str, content: str) -> None:
	os.makedirs(os.path.dirname(path), exist_ok=True)
	with open(path, "w", encoding="utf-8") as f:
		f.write(content)


def main() -> int:
	if not os.path.isdir(TEMPLATES_DIR):
		print(f"ERROR: Missing Kiro templates directory: {TEMPLATES_DIR}", file=sys.stderr)
		return 2

	if not os.path.isfile(INIT_JSON_TEMPLATE) or not os.path.isfile(REQ_INIT_TEMPLATE):
		print("ERROR: Missing spec templates (init.json or requirements-init.md).", file=sys.stderr)
		return 2

	if len(sys.argv) < 2:
		print("Usage: tools/kiro_spec_init.py <project-description>", file=sys.stderr)
		return 2

	project_description = " ".join(sys.argv[1:]).strip()
	base_feature = slugify(project_description)[:80]

	specs_root = os.path.join(KIRO_DIR, "specs")
	os.makedirs(specs_root, exist_ok=True)
	feature_name = ensure_unique_feature_name(base_feature, specs_root)

	spec_dir = os.path.join(specs_root, feature_name)
	os.makedirs(spec_dir, exist_ok=True)

	timestamp = datetime.utcnow().isoformat(timespec="seconds") + "Z"

	init_json = read_text(INIT_JSON_TEMPLATE)
	req_init_md = read_text(REQ_INIT_TEMPLATE)

	for placeholder, value in (
		("{{FEATURE_NAME}}", feature_name),
		("{{TIMESTAMP}}", timestamp),
		("{{PROJECT_DESCRIPTION}}", project_description),
	):
		init_json = init_json.replace(placeholder, value)
		req_init_md = req_init_md.replace(placeholder, value)

	spec_json_path = os.path.join(spec_dir, "spec.json")
	requirements_md_path = os.path.join(spec_dir, "requirements.md")

	write_text(spec_json_path, init_json)
	write_text(requirements_md_path, req_init_md)

	print("== Kiro spec initialized ==")
	print(f"Feature: {feature_name}")
	print(f"Created: {spec_json_path}")
	print(f"Created: {requirements_md_path}")
	print('Next: Use "/kiro/spec-requirements {feature}" in Cursor to continue.')
	return 0


if __name__ == "__main__":
	sys.exit(main())


