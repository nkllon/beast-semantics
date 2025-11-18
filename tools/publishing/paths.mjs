import semver from 'semver';

export function releasePathFromVersion(version) {
	// Strict SemVer: accept only exact Major.Minor.Patch (no pre-release or build)
	const parsed = semver.parse(version, { loose: false, includePrerelease: false });
	if (!parsed || parsed.prerelease.length || parsed.build.length || parsed.version !== version) {
		throw new Error(`Invalid SemVer: ${version}`);
	}
	return `/releases/${version}/`;
}


