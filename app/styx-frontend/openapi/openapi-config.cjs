'use strict'

const tags = [
	'actorList',
	'adminNotifications',
	'adminUsers',
	'announcementList',
	'asset',
	'auth',
	'calendar',
	'dataMigration',
	'favoriteIcons',
	'profile',
	'mindmap',
	'imageGeneration',
	'worldBulk',
	'worldTag',
	'worldColor',
	'worldWiki',
	'worldWikiFolder',
	'worldEvent',
	'worldEventDelta',
	'worldEventTracks',
	'worldList',
	'worldDetails',
	'worldCollaborators',
	'worldSearch',
]

const tagMatcher = (pattern) => {
	return (_, operationDefinition) => {
		return operationDefinition.operation.tags && operationDefinition.operation.tags[0] === pattern
	}
}

const noTagMatcher = () => {
	return (_, operationDefinition) => {
		return (
			!operationDefinition.operation.tags ||
			operationDefinition.operation.tags.length === 0 ||
			!tags.some((tag) => operationDefinition.operation.tags[0] === tag)
		)
	}
}

const config = {
	schemaFile: 'http://localhost:3000/api-json',
	apiFile: '../src/api/base/baseApi.ts',
	apiImport: 'baseApi',
	outputFiles: tags.reduce(
		(acc, tag) => {
			acc[`../src/api/${tag}Api.ts`] = {
				exportName: `${tag}Api`,
				filterEndpoints: tagMatcher(tag),
			}
			return acc
		},
		{
			'../src/api/otherApi.ts': {
				exportName: 'otherApi',
				filterEndpoints: noTagMatcher(),
			},
		},
	),
	tag: true,
	hooks: {
		queries: true,
		lazyQueries: true,
		mutations: true,
	},
}
exports.default = config
