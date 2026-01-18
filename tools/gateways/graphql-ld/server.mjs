import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contextPath = path.join(__dirname, 'context.json');

async function readContext() {
	try {
		const data = await fs.readFile(contextPath, 'utf-8');
		return JSON.parse(data);
	} catch {
		return { '@context': {} };
	}
}

async function start() {
	const server = http.createServer(async (req, res) => {
		if (!req.url) {
			res.statusCode = 400;
			res.end('Bad Request');
			return;
		}
		if (req.url.startsWith('/health')) {
			res.setHeader('content-type', 'application/json');
			res.end(JSON.stringify({ ok: true, node: process.version }));
			return;
		}
		if (req.url.startsWith('/context')) {
			res.setHeader('content-type', 'application/json');
			const ctx = await readContext();
			res.end(JSON.stringify(ctx));
			return;
		}
		res.statusCode = 404;
		res.end('Not Found');
	});
	const port = Number(process.env.PORT || 0);
	await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
	const address = server.address();
	if (address && typeof address === 'object') {
		// eslint-disable-next-line no-console
		console.log(`Listening on ${address.port}`);
	}
	return server;
}

await start();


