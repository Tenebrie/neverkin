/**
 * ESLint rule to keep queries inside a `$transaction` callback from reaching the base client.
 *
 * A query that escapes the transaction runs on its own connection: it cannot see the
 * transaction's uncommitted writes, and its own writes survive a rollback. Against PGlite,
 * which has a single connection, it deadlocks instead.
 *
 * Every transaction-capable function here declares an optional `Prisma.TransactionClient`
 * parameter, which splits the callees into two cases the checker can tell apart:
 *   - the callee declares one, so the transaction can be handed down — require that it is;
 *   - it declares none, so no call site could ever pass one — walk its body, across files,
 *     and report it when it reaches `getPrismaClient()` with nothing to forward.
 */

import ts from 'typescript'

const BASE_CLIENT = 'getPrismaClient'
const TRANSACTION_METHOD = '$transaction'
const TRANSACTION_TYPE = 'TransactionClient'
// Deep enough for a router → service → query helper chain, shallow enough to stay cheap.
const MAX_DEPTH = 8

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require every query inside a $transaction callback to run on the transaction client, including through helpers called across files.',
			category: 'Possible Errors',
			recommended: true,
		},
		messages: {
			baseClient:
				'`{{baseClient}}()` inside a transaction opens a separate connection, so this query cannot see the uncommitted writes and survives a rollback. Use `{{tx}}` instead.',
			missingArgument:
				'`{{callee}}` accepts a transaction client but was not given one, so it runs on a separate connection. Pass `{{tx}}` as the `{{parameter}}` argument.',
			calleeEscapes:
				'`{{callee}}` reaches `{{baseClient}}()` and accepts no transaction client, so calling it here escapes the transaction. Give it an optional `Prisma.{{transactionType}}` parameter and pass `{{tx}}`.',
		},
		schema: [],
		fixable: null,
	},

	create(context) {
		const services = context.sourceCode.parserServices
		if (!services?.program || !services.esTreeNodeToTSNodeMap) {
			return {}
		}
		const checker = services.program.getTypeChecker()
		const escapeCache = new Map()

		return {
			CallExpression(node) {
				const tx = enclosingTransactionClient(node, context)
				if (!tx) {
					return
				}

				const data = { tx, baseClient: BASE_CLIENT, transactionType: TRANSACTION_TYPE }

				if (isBaseClientCall(node)) {
					context.report({ node, messageId: 'baseClient', data })
					return
				}

				// Queries chained off the transaction client are the whole point.
				if (rootName(node.callee) === tx) {
					return
				}

				const declaration = calleeDeclaration(node, services, checker)
				if (!declaration || isExternal(declaration)) {
					return
				}

				const parameter = transactionParameter(declaration)
				if (parameter) {
					if (!receivesTransaction(node.arguments[parameter.index], parameter, tx)) {
						context.report({
							node,
							messageId: 'missingArgument',
							data: { ...data, callee: calleeText(context, node), parameter: parameter.name },
						})
					}
					return
				}

				if (reachesBaseClient(declaration, checker, escapeCache, 0)) {
					context.report({
						node,
						messageId: 'calleeEscapes',
						data: { ...data, callee: calleeText(context, node) },
					})
				}
			},
		}
	},
}

/**
 * The name bound to the transaction client by the nearest enclosing `$transaction` callback,
 * or null when the call is not inside one. The array form of `$transaction` takes no callback,
 * so it never produces a binding and never reaches here.
 */
function enclosingTransactionClient(node, context) {
	for (const ancestor of context.sourceCode.getAncestors(node).reverse()) {
		if (ancestor.type !== 'ArrowFunctionExpression' && ancestor.type !== 'FunctionExpression') {
			continue
		}
		const call = ancestor.parent
		if (
			call?.type !== 'CallExpression' ||
			call.arguments[0] !== ancestor ||
			call.callee.type !== 'MemberExpression' ||
			call.callee.property.type !== 'Identifier' ||
			call.callee.property.name !== TRANSACTION_METHOD
		) {
			continue
		}
		const parameter = ancestor.params[0]
		return parameter?.type === 'Identifier' ? parameter.name : null
	}
	return null
}

function isBaseClientCall(node) {
	if (node.callee.type !== 'Identifier' || node.callee.name !== BASE_CLIENT) {
		return false
	}
	const [argument] = node.arguments
	return !argument || (argument.type === 'Identifier' && argument.name === 'undefined')
}

function rootName(node) {
	let current = node
	while (current.type === 'MemberExpression') {
		current = current.object
	}
	return current.type === 'Identifier' ? current.name : null
}

function calleeText(context, node) {
	return context.sourceCode.getText(node.callee)
}

function calleeDeclaration(node, services, checker) {
	const callee = services.esTreeNodeToTSNodeMap.get(node.callee)
	const symbol = callee && checker.getSymbolAtLocation(callee)
	const aliased = symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
	return functionOf(aliased?.valueDeclaration ?? aliased?.declarations?.[0])
}

/** Unwraps the shapes a service method is written as: object literal, const arrow, or declaration. */
function functionOf(declaration) {
	if (!declaration) {
		return null
	}
	if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) {
		return declaration
	}
	const initializer = ts.isPropertyAssignment(declaration)
		? declaration.initializer
		: ts.isVariableDeclaration(declaration)
			? declaration.initializer
			: null
	if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
		return initializer
	}
	return null
}

function isExternal(declaration) {
	return declaration.getSourceFile().fileName.includes('node_modules')
}

/**
 * Read off the annotation rather than the checked type: `Prisma.TransactionClient` widens to a
 * union of every delegate, which prints as thousands of characters and matches nothing useful.
 *
 * Services here take the client either on its own or as one field of an options object, so the
 * annotation also says which of the two a call site has to satisfy.
 */
function transactionParameter(declaration) {
	for (const [index, parameter] of declaration.parameters.entries()) {
		const annotation = parameter.type
		if (!annotation?.getText().includes(TRANSACTION_TYPE)) {
			continue
		}
		if (!ts.isTypeLiteralNode(annotation)) {
			return { index, name: parameter.name.getText() }
		}
		const field = annotation.members.find((member) => member.type?.getText().includes(TRANSACTION_TYPE))
		if (field?.name) {
			return { index, name: field.name.getText(), field: field.name.getText() }
		}
	}
	return null
}

function receivesTransaction(argument, parameter, tx) {
	if (!parameter.field) {
		return argument?.type === 'Identifier' && argument.name === tx
	}
	if (argument?.type !== 'ObjectExpression') {
		return false
	}
	return argument.properties.some(
		(property) =>
			property.type === 'Property' &&
			!property.computed &&
			property.key.name === parameter.field &&
			property.value.type === 'Identifier' &&
			property.value.name === tx,
	)
}

/**
 * Whether the function reaches the base client, following calls into other files. A callee that
 * declares a transaction parameter stops the walk: it can be handed the transaction, so whether
 * it escapes is decided at its own call site, not here.
 */
function reachesBaseClient(declaration, checker, cache, depth) {
	if (depth > MAX_DEPTH || !declaration.body) {
		return false
	}
	const cached = cache.get(declaration)
	if (cached !== undefined) {
		return cached
	}
	// Recursion reaches nothing on its own; the cycle is resolved by the other branches.
	cache.set(declaration, false)

	let escapes = false
	const visit = (node) => {
		if (escapes) {
			return
		}
		if (ts.isCallExpression(node)) {
			if (ts.isIdentifier(node.expression) && node.expression.text === BASE_CLIENT) {
				escapes = node.arguments.length === 0
			} else {
				const callee = resolveCallee(node, checker)
				if (callee && !isExternal(callee) && !transactionParameter(callee)) {
					escapes = reachesBaseClient(callee, checker, cache, depth + 1)
				}
			}
		}
		if (!escapes) {
			ts.forEachChild(node, visit)
		}
	}
	visit(declaration.body)

	cache.set(declaration, escapes)
	return escapes
}

function resolveCallee(node, checker) {
	const symbol = checker.getSymbolAtLocation(node.expression)
	const aliased = symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
	return functionOf(aliased?.valueDeclaration ?? aliased?.declarations?.[0])
}
