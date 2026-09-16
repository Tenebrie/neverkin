'use strict'

/**
 * Endpoints listed here will have their `invalidatesTags` cleared to `[]`
 * after OpenAPI code generation.
 */
module.exports = [
	'createNode',
	'updateNode',
	'moveMindmapNodes',
	'createMindmapWires',
	'updateMindmapWire',
	'deleteMindmapWires',
	'moveWikiEntity',
	'bulkMoveWikiEntities',
	'reparentNode',
]
