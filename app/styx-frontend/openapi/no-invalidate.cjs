'use strict'

/**
 * Endpoints listed here will have their `invalidatesTags` cleared to `[]`
 * after OpenAPI code generation.
 */
module.exports = [
	'createNode',
	'updateNode',
	'moveMindmapElements',
	'createMindmapWires',
	'updateMindmapWire',
	'deleteMindmapWires',
	'createMindmapWaypoints',
	'deleteMindmapWaypoints',
	'moveWikiEntity',
	'bulkMoveWikiEntities',
	'bulkUpdateEntities',
	'reparentNode',
]
