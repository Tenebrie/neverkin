/**
 * ESLint rule to prevent hand-built local paths that bypass the typed router.
 *
 * A path assembled from a template string, concatenation or a literal href is invisible
 * to route typing, so a typo or a removed route is only found at runtime.
 * Use `to` + `params`, or `router.buildLocation()` when a raw href is required.
 */

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow building local paths from template strings, concatenation or literal hrefs. Use typed routes instead.',
			category: 'Best Practices',
			recommended: true,
		},
		messages: {
			noTemplatePath: 'Do not build local paths from template strings. Use a typed route with params.',
			noConcatPath: 'Do not concatenate local paths. Use a typed route with params.',
			noLiteralHref:
				'Do not hardcode local paths in href. Use a typed route, or router.buildLocation().href.',
		},
		schema: [],
		fixable: null,
	},

	create(context) {
		return {
			TemplateLiteral(node) {
				if (isLocalPath(node.quasis[0].value.raw)) {
					context.report({ node, messageId: 'noTemplatePath' })
				}
			},

			BinaryExpression(node) {
				if (node.operator === '+' && node.left.type === 'Literal' && isLocalPath(node.left.value)) {
					context.report({ node, messageId: 'noConcatPath' })
				}
			},

			JSXAttribute(node) {
				if (node.name.name === 'href' && node.value?.type === 'Literal' && isLocalPath(node.value.value)) {
					context.report({ node, messageId: 'noLiteralHref' })
				}
			},
		}
	},
}

function isLocalPath(value) {
	return typeof value === 'string' && value.startsWith('/')
}
