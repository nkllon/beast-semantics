export function isAllowedGithubUrl(urlStr) {
	try {
		const url = new URL(urlStr);
		if (url.protocol !== 'https:') return false;
		if (url.hostname !== 'github.com') return false;
		// Allowed patterns:
		// - /settings/*
		// - /orgs/:org/settings/*
		// - /organizations/:org/settings/* (legacy path)
		return /^\/(settings\/|orgs\/[^/]+\/settings\/|organizations\/[^/]+\/settings\/)/.test(url.pathname);
	} catch {
		return false;
	}
}





