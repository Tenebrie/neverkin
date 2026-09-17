/**
 * ESLint rule to keep destructive Prisma filters from widening to the whole table.
 *
 * Prisma drops `undefined` keys, so a filter whose every column may be absent compiles to
 * `WHERE true` and the statement matches every row. Reading the checked type of the `where`
 * object catches that even when it is assembled by a spread, which hides the columns.
 *
 * Two invariants, both read off the types rather than the syntax:
 *   - the filter carries an owner column, whenever the model has one;
 *   - at least one column always reaches the query, so the filter cannot evaporate. A column
 *     written as `null` counts: that is an explicit `IS NULL`, not an absent constraint.
 */

import ts from 'typescript'

const DESTRUCTIVE_METHODS = new Set(['deleteMany', 'updateMany', 'updateManyAndReturn'])
// Not every model hangs off a world: a calendar or a pin is owned by a user instead.
const TENANT_KEYS = ['worldId', 'ownerId', 'userId']
// Pinning the primary key enumerates the rows, so an owner column adds no bound on top.
const PRIMARY_KEY = 'id'
const VANISHES = ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Require destructive Prisma queries to carry an owner column, unless they pin the primary key, and to keep at least one column that cannot be dropped as undefined.',
			category: 'Possible Errors',
			recommended: true,
		},
		messages: {
			missingTenantKey:
				'Destructive {{method}} is not scoped by an owner column ({{tenantKeys}}). Add one so a defect cannot reach beyond a single world or user.',
			noSolidFilter:
				'Destructive {{method}} has no column that always reaches the query — every filter here is optional or possibly undefined, so Prisma can drop them all and match every row.',
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
					context.report({ node: target, messageId, data: { method, tenantKeys: TENANT_KEYS.join(', ') } })

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

				const ownerColumns = tenantKeysOfModel(services.esTreeNodeToTSNodeMap.get(node.callee), checker)

				for (const variant of unionParts(checker.getTypeAtLocation(valueNode))) {
					const solid = checker
						.getPropertiesOfType(variant)
						.filter((property) => isGuaranteed(property, valueNode, checker))
						.map((property) => property.name)

					const enumeratesRows = solid.includes(PRIMARY_KEY)
					if (
						!enumeratesRows &&
						ownerColumns.length > 0 &&
						!solid.some((name) => ownerColumns.includes(name))
					) {
						report('missingTenantKey', where)
					}
					if (solid.length === 0) {
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
function tenantKeysOfModel(calleeNode, checker) {
	const signature = checker.getTypeAtLocation(calleeNode).getCallSignatures()[0]
	const typeParameter = signature?.getTypeParameters()?.[0]
	const args = typeParameter && checker.getBaseConstraintOfType(typeParameter)
	const where = args && checker.getPropertyOfType(args, 'where')
	if (!where) {
		return []
	}
	const parts = unionParts(checker.getTypeOfSymbolAtLocation(where, calleeNode))
	return TENANT_KEYS.filter((key) => parts.some((part) => !!checker.getPropertyOfType(part, key)))
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
