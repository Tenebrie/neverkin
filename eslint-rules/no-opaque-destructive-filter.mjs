/**
 * ESLint rule to keep destructive Prisma filters from widening to the whole table.
 *
 * Prisma drops `undefined` keys, so a filter whose every column may be absent compiles to
 * `WHERE true` and the statement matches every row. Reading the checked type of the `where`
 * object catches that even when it is assembled by a spread, which hides the columns.
 *
 * Two invariants, both read off the types rather than the syntax:
 *   - the filter carries `worldId`, whenever the model has one;
 *   - at least one further column always reaches the query, so something besides the tenant
 *     key constrains it. A column written as `null` counts: that is an explicit `IS NULL`.
 */

import ts from 'typescript'

const DESTRUCTIVE_METHODS = new Set(['deleteMany', 'updateMany', 'updateManyAndReturn'])
const TENANT_KEY = 'worldId'
const VANISHES = ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require destructive Prisma queries to be scoped by worldId and by at least one column that cannot be null or undefined.',
			category: 'Possible Errors',
			recommended: true,
		},
		messages: {
			missingWorldId:
				'Destructive {{method}} is not scoped by {{tenantKey}}. Add it to the filter so a defect cannot reach beyond one world.',
			noSolidFilter:
				'Destructive {{method}} has no guaranteed column besides {{tenantKey}} — every other filter here is optional, nullable or possibly undefined, so Prisma can drop them and match every row it can reach.',
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

		return {
			CallExpression(node) {
				const method = destructiveMethodName(node)
				if (!method) {
					return
				}

				const report = (messageId, target) =>
					context.report({ node: target, messageId, data: { method, tenantKey: TENANT_KEY } })

				const options = node.arguments[0]
				if (options?.type !== 'ObjectExpression') {
					return
				}

				const where = findProperty(options, 'where')
				if (!where) {
					report('noSolidFilter', node)
					return
				}

				const valueNode = services.esTreeNodeToTSNodeMap.get(where.value)
				if (!valueNode) {
					return
				}

				const modelHasTenantKey = hasTenantKey(services.esTreeNodeToTSNodeMap.get(node.callee), checker)

				for (const variant of unionParts(checker.getTypeAtLocation(valueNode))) {
					const solid = checker
						.getPropertiesOfType(variant)
						.filter((property) => isGuaranteed(property, valueNode, checker))
						.map((property) => property.name)

					if (modelHasTenantKey && !solid.includes(TENANT_KEY)) {
						report('missingWorldId', where)
					}
					if (!solid.some((name) => name !== TENANT_KEY)) {
						report('noSolidFilter', where)
					}
				}
			},
		}
	},
}

function destructiveMethodName(node) {
	const callee = node.callee
	if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier') {
		return null
	}
	return DESTRUCTIVE_METHODS.has(callee.property.name) ? callee.property.name : null
}

function findProperty(objectExpression, name) {
	return objectExpression.properties.find(
		(property) => property.type === 'Property' && !property.computed && property.key.name === name,
	)
}

function unionParts(type) {
	return type.isUnion() ? type.types : [type]
}

/**
 * The contextual type of the filter is the argument's own type — Prisma infers `T` from it —
 * so the model's columns come from the declared constraint on that type parameter instead.
 */
function hasTenantKey(calleeNode, checker) {
	const signature = checker.getTypeAtLocation(calleeNode).getCallSignatures()[0]
	const typeParameter = signature?.getTypeParameters()?.[0]
	const args = typeParameter && checker.getBaseConstraintOfType(typeParameter)
	const where = args && checker.getPropertyOfType(args, 'where')
	if (!where) {
		return false
	}
	return unionParts(checker.getTypeOfSymbolAtLocation(where, calleeNode)).some(
		(part) => !!checker.getPropertyOfType(part, TENANT_KEY),
	)
}

/**
 * Prisma drops `undefined` keys but emits `IS NULL` for `null`, so a column written as `null`
 * constrains the statement and a column that merely *may* be null does not reliably narrow it.
 */
function isGuaranteed(property, node, checker) {
	if (property.flags & ts.SymbolFlags.Optional) {
		return false
	}
	const parts = unionParts(checker.getTypeOfSymbolAtLocation(property, node))
	if (parts.some((part) => part.flags & VANISHES)) {
		return false
	}
	return parts.length === 1 || !parts.some((part) => part.flags & ts.TypeFlags.Null)
}
