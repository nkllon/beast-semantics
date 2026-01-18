export async function workerFetch(request, env) {
	const url = new URL(request.url);
	let path = url.pathname; // e.g., /words/latest/ontology

	// Resolve /latest → /{version}/ using env.getLatestVersion if available
	if (path.includes('/latest/')) {
		const latestVersion = typeof env?.getLatestVersion === 'function'
			? await env.getLatestVersion()
			: 'latest';
		path = path.replace('/latest/', `/${latestVersion}/`);
	}

	// Basic content negotiation
	const accept = request.headers.get('Accept') || '';
	let ext = 'html';
	let contentType = 'text/html';
	if (accept.includes('text/turtle')) {
		ext = 'ttl';
		contentType = 'text/turtle';
	} else if (accept.includes('application/ld+json')) {
		ext = 'jsonld';
		contentType = 'application/ld+json';
	}

	// Fetch from storage (BUCKET stub in tests)
	const objectKey = `${path}.${ext}`;
	const object = await env.BUCKET.get(objectKey);
	if (!object) {
		return new Response('Not Found', { status: 404 });
	}

	return new Response(object.body, {
		status: 200,
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Vary': 'Accept'
		}
	});
}





