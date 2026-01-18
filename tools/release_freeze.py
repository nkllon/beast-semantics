#!/usr/bin/env python3
import argparse
import os
import shutil
import sys
import hashlib
from pathlib import Path

import semver


def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def copy_tree(src: Path, dest: Path) -> None:
    if not src.exists():
        return
    if src.is_file():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        return
    for root, dirs, files in os.walk(src):
        root_path = Path(root)
        rel = root_path.relative_to(src)
        target_root = dest / rel
        target_root.mkdir(parents=True, exist_ok=True)
        for name in files:
            src_file = root_path / name
            dest_file = target_root / name
            shutil.copy2(src_file, dest_file)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create an immutable release snapshot with checksums.")
    parser.add_argument("version", help="Release version (SemVer, e.g., 1.2.3)")
    args = parser.parse_args()

    try:
        _ = semver.Version.parse(args.version)
    except ValueError as e:
        print(f"Invalid version '{args.version}': {e}", file=sys.stderr)
        return 2

    repo_root = Path(__file__).resolve().parents[1]
    out_dir = repo_root / "build" / "releases" / args.version
    manifest = out_dir / "MANIFEST.sha256"

    if out_dir.exists():
        print(f"Release directory already exists: {out_dir}", file=sys.stderr)
        return 1

    # Snapshot targets
    targets = [
        ("AGENTS.md", "AGENTS.md"),
        ("README.md", "README.md"),
        (".cursor/commands/kiro", ".cursor/commands/kiro"),
        (".kiro/settings", ".kiro/settings"),
        ("tools", "tools"),
    ]

    print(f"Creating release snapshot: {out_dir}")
    out_dir.mkdir(parents=True, exist_ok=False)

    for src_rel, dest_rel in targets:
        src = repo_root / src_rel
        dest = out_dir / dest_rel
        if src.exists():
            copy_tree(src, dest)
        else:
            print(f"Warning: missing '{src_rel}' (skipped)", file=sys.stderr)

    # Compute manifest
    print("Computing MANIFEST.sha256 ...")
    checks = []
    for root, _, files in os.walk(out_dir):
        for name in files:
            path = Path(root) / name
            if path == manifest:
                continue
            rel_path = path.relative_to(out_dir)
            digest = compute_sha256(path)
            checks.append((str(rel_path).replace("\\", "/"), digest))

    checks.sort(key=lambda x: x[0])
    with manifest.open("w", encoding="utf-8") as mf:
        for rel, digest in checks:
            mf.write(f"{digest}  {rel}\n")

    print(f"Release snapshot created with {len(checks)} file(s).")
    print(f"Manifest: {manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


