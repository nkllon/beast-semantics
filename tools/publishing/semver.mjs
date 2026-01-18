import semver from 'semver';

export function isStrictSemVer(version) {
	// Strict SemVer: accept only exact Major.Minor.Patch (no pre-release or build)
	if (typeof version !== 'string') return false;
	const parsed = semver.parse(version, { loose: false, includePrerelease: false });
	if (!parsed) return false;
	// Reject any pre-release/build metadata and ensure normalized version matches input
	if (parsed.prerelease.length || parsed.build.length) return false;
	return parsed.version === version;
}


