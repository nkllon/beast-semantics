import semver from 'semver';
import path from 'node:path';
import fs from 'node:fs';

export function releasePathFromVersion(version) {
	// Strict SemVer: accept only exact Major.Minor.Patch (no pre-release or build)
	const parsed = semver.parse(version, { loose: false, includePrerelease: false });
	if (!parsed || parsed.prerelease.length || parsed.build.length || parsed.version !== version) {
		throw new Error(`Invalid SemVer: ${version}`);
	}
	return `/releases/${version}/`;
}

export function assertReleaseWriteIsAllowed(rootDir, version) {
	// Validate version and derive the release path on disk
	const rel = releasePathFromVersion(version); // e.g., /releases/1.2.3/
	const target = path.join(rootDir, rel.slice(1)); // strip leading slash
	// Immutability: if the versioned path already exists, disallow writes
	if (fs.existsSync(target)) {
		throw new Error(`Release is immutable: ${version} already exists at ${target}`);
	}
	return true;
}


