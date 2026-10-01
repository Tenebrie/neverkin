/**
 * ESLint rule to keep endpoint tests pointed at routes that actually exist.
 *
 * A request path in a spec is an ordinary string: rename or delete the route and the test
 * still compiles, it just starts asserting against a 404 forever. The route table is read
 * back out of the router sources in the same program, so what gets checked is the live
 * registration and not a generated snapshot of it.
 *
 * `describe('POST /api/...')` headings are checked the same way, so the heading cannot go
 * stale while the requests underneath it keep passing.
 */

import ts from 'typescript'

const ROUTER_DIRECTORY = '/src/routers/'
const METHODS = {
	get: 'get',
	post: 'post',
	put: 'put',
	patch: 'patch',
	delete: 'delete',
	del: 'delete',
	sendGet: 'get',
	sendPost: 'post',
	sendPut: 'put',
	sendPatch: 'patch',
	sendDelete: 'delete',
}
// Stands in for an interpolated value, so a template path still splits into segments.
const INTERPOLATION = '\0'
// A suggestion is only useful when the two paths share a meaningful prefix.
const MINIMUM_SHARED_SEGMENTS = 2

const routeTables = new WeakMap()

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require request paths and method headings in endpoint tests to match a registered route.',
			category: 'Possible Errors',
			recommended: true,
		},
		messages: {
			unknownPath: 'No {{method}} route is registered for `{{path}}`.',
			didYouMean: 'No {{method}} route is registered for `{{path}}`. Closest match: `{{suggestion}}`.',
			wrongMethod: '`{{path}}` is registered for {{registered}}, not {{method}}.',
		},
		schema: [],
		fixable: null,
	},

	create(context) {
		const program = context.sourceCode.parserServices?.program
		if (!program) {
			return {}
		}
		const routes = routeTable(program)

		const check = (node, method, path) => {
			const segments = segmentsOf(path)
			if (!segments || matches(routes.get(method), segments)) {
				return
			}

			const data = { method: method.toUpperCase(), path }
			const registered = [...routes.keys()].filter((other) => matches(routes.get(other), segments))
			if (registered.length > 0) {
				const names = registered.map((other) => other.toUpperCase()).join(', ')
				context.report({ node, messageId: 'wrongMethod', data: { ...data, registered: names } })
				return
			}

			const suggestion = nearest(routes.get(method), segments)
			if (suggestion) {
				context.report({ node, messageId: 'didYouMean', data: { ...data, suggestion } })
				return
			}
			context.report({ node, messageId: 'unknownPath', data })
		}

		return {
			CallExpression(node) {
				const callee = calleeName(node.callee)
				const request = METHODS[callee]
				if (request) {
					const path = pathOf(node.arguments[0])
					if (path) {
						check(node.arguments[0], request, path)
					}
					return
				}

				if (callee !== 'describe') {
					return
				}
				const heading = /^([A-Z]+) (\/\S*)$/.exec(pathOf(node.arguments[0], { heading: true }) ?? '')
				const method = heading && METHODS[heading[1].toLowerCase()]
				if (method) {
					check(node.arguments[0], method, heading[2])
				}
			},
		}
	},
}

function calleeName(callee) {
	if (callee.type === 'MemberExpression') {
		return callee.property.type === 'Identifier' ? callee.property.name : null
	}
	return callee.type === 'Identifier' ? callee.name : null
}

/** The literal text of a path argument, with every interpolated value collapsed to a placeholder. */
function pathOf(node, { heading } = {}) {
	if (node?.type === 'Literal') {
		return typeof node.value === 'string' ? node.value : null
	}
	if (node?.type !== 'TemplateLiteral' || heading) {
		return null
	}
	return node.quasis.map((quasi) => quasi.value.raw).join(INTERPOLATION)
}

/** Path segments, where `null` is a segment that matches anything: a route param or an interpolation. */
function segmentsOf(path) {
	const [withoutQuery] = path.split('?')
	if (!withoutQuery.startsWith('/')) {
		return null
	}
	return withoutQuery
		.replace(/\/$/, '')
		.split('/')
		.slice(1)
		.map((segment) => (segment.startsWith(':') || segment.includes(INTERPOLATION) ? null : segment))
}

function compatible(left, right) {
	return left === null || right === null || left === right
}

function matches(routes, segments) {
	return (routes ?? []).some(
		(route) =>
			route.segments.length === segments.length &&
			route.segments.every((segment, index) => compatible(segment, segments[index])),
	)
}

function nearest(routes, segments) {
	let best = null
	let bestShared = MINIMUM_SHARED_SEGMENTS - 1

	for (const route of routes ?? []) {
		let shared = 0
		while (shared < route.segments.length && compatible(route.segments[shared], segments[shared])) {
			shared++
		}
		if (shared > bestShared) {
			bestShared = shared
			best = route.path
		}
	}
	return best
}

function routeTable(program) {
	const cached = routeTables.get(program)
	if (cached) {
		return cached
	}

	const routes = new Map()
	for (const file of program.getSourceFiles()) {
		if (file.fileName.includes(ROUTER_DIRECTORY) && !file.fileName.endsWith('.spec.ts')) {
			collectRoutes(file, routes)
		}
	}
	routeTables.set(program, routes)
	return routes
}

function collectRoutes(file, routes) {
	const visit = (node) => {
		if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
			const method = METHODS[node.expression.name.text]
			const [path] = node.arguments
			if (method && path && ts.isStringLiteral(path) && path.text.startsWith('/')) {
				const registered = routes.get(method) ?? []
				registered.push({ path: path.text, segments: segmentsOf(path.text) })
				routes.set(method, registered)
			}
		}
		ts.forEachChild(node, visit)
	}
	ts.forEachChild(file, visit)
}
