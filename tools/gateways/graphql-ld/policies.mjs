export function requireAuth(req, opts = {}) {
	const headers = normalizeHeaders(req.headers || {});
	if (opts.allowPublic) return true;
	const bearer = headers['authorization'];
	const cfAccess = headers['cf-access-jwt-assertion'];
	if (!bearer && !cfAccess) {
		throw new Error('Unauthorized: missing authentication');
	}
	return true;
}

export function enforceDepth(query, maxDepth) {
	// Very lightweight depth estimator: counts nested braces
	let depth = 0;
	let max = 0;
	for (const ch of query) {
		if (ch === '{') {
			depth += 1;
			if (depth > max) max = depth;
		} else if (ch === '}') {
			depth = Math.max(0, depth - 1);
		}
	}
	return max <= maxDepth;
}

export function cacheKeyForPersistedQuery(id, userCtx = {}) {
	const sub = userCtx.sub || 'anon';
	const admin = !!userCtx.isAdmin;
	return `persisted:${id}:sub=${sub}:admin=${admin}`;
}

function normalizeHeaders(h) {
	const out = {};
	for (const [k, v] of Object.entries(h)) {
		out[String(k).toLowerCase()] = v;
	}
	return out;
}





