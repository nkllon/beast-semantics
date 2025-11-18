/**
 * Minimal YAML parser for simple k: v and nested maps with indentation.
 * Supports:
 *  - Comments starting with '#'
 *  - Root scalar mappings: key: value
 *  - One-level nested mappings (e.g., weights: { k: v } via indentation)
 *  - Numbers, booleans, and strings (unquoted)
 *
 * Not a full YAML implementation. Intentionally limited to project policy files.
 */
export function parseSimpleYaml(text) {
	const root = {};
	const stack = [{ indent: -1, obj: root }];
	const lines = text.split(/\r?\n/);
	for (let rawLine of lines) {
		let line = rawLine;
		const commentIdx = line.indexOf('#');
		if (commentIdx >= 0) line = line.slice(0, commentIdx);
		if (!line.trim()) continue;
		const indent = countLeadingSpaces(line);
		line = line.slice(indent);
		// Maintain stack based on indentation
		while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
			stack.pop();
		}
		const current = stack[stack.length - 1].obj;
		// Handle "key:" (map start) or "key: value"
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		let value = line.slice(idx + 1).trim();
		if (value === '') {
			// Start of nested map
			const child = {};
			current[key] = child;
			stack.push({ indent, obj: child });
		} else {
			current[key] = coerceScalar(value);
		}
	}
	return root;
}

function countLeadingSpaces(s) {
	let n = 0;
	for (let i = 0; i < s.length; i += 1) {
		if (s[i] === ' ') n += 1;
		else break;
	}
	return n;
}

function coerceScalar(value) {
	// Strip surrounding quotes if any
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}
	if (value === 'true') return true;
	if (value === 'false') return false;
	const num = Number(value);
	if (Number.isFinite(num)) return num;
	return value;
}


