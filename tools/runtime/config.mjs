function ensurePresent(env, keys) {
	const missing = keys.filter(k => !env[k] || String(env[k]).trim() === '');
	if (missing.length > 0) {
		throw new Error(`Missing required config: ${missing.join(', ')}`);
	}
}

export function loadConfigFromEnv(env = process.env) {
	const required = [
		'SPARQL_ENDPOINT',
		'SPARQL_UPDATE_ENDPOINT',
		'DATASET_ID',
		'GATEWAY_URL',
		'AUTH_MODE',
		'AUTH_TOKEN_HEADER',
		'CACHE_TTL_S',
		'CACHE_BYPASS_HEADER',
	];
	ensurePresent(env, required);
	const ttl = Number(env.CACHE_TTL_S);
	if (!Number.isFinite(ttl)) {
		throw new Error('CACHE_TTL_S must be a number of seconds');
	}
	const authMode = String(env.AUTH_MODE).toLowerCase();
	if (!['none', 'header', 'token'].includes(authMode)) {
		throw new Error('AUTH_MODE must be one of: none, header, token');
	}
	return {
		SPARQL_ENDPOINT: String(env.SPARQL_ENDPOINT),
		SPARQL_UPDATE_ENDPOINT: String(env.SPARQL_UPDATE_ENDPOINT),
		DATASET_ID: String(env.DATASET_ID),
		GATEWAY_URL: String(env.GATEWAY_URL),
		AUTH_MODE: authMode,
		AUTH_TOKEN_HEADER: String(env.AUTH_TOKEN_HEADER),
		CACHE_TTL_S: ttl,
		CACHE_BYPASS_HEADER: String(env.CACHE_BYPASS_HEADER),
	};
}

export default { loadConfigFromEnv };


