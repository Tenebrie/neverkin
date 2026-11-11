#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const noInvalidate = new Set(require('./no-invalidate.cjs'))
const apiDir = path.resolve(__dirname, '../src/api')
const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('Api.ts'))

const results = []

for (const file of files) {
	const filePath = path.join(apiDir, file)
	const content = fs.readFileSync(filePath, 'utf-8')
	const lines = content.split('\n')

	let currentEndpoint = null
	let isMutation = false
	let isSkippingTags = false
	const strippedEndpoints = []
	const result = []

	for (const line of lines) {
		if (isSkippingTags) {
			isSkippingTags = !line.includes(']')
			continue
		}

		const endpointMatch = line.match(/^\s+(\w+):\s*build\.(mutation|query)/)
		if (endpointMatch) {
			currentEndpoint = endpointMatch[1]
			isMutation = endpointMatch[2] === 'mutation'
		}

		if (
			isMutation &&
			currentEndpoint &&
			noInvalidate.has(currentEndpoint) &&
			line.match(/^\s+invalidatesTags:/)
		) {
			result.push(line.replace(/invalidatesTags:.*/, 'invalidatesTags: [],'))
			isSkippingTags = !line.includes(']')
			strippedEndpoints.push(currentEndpoint)
		} else {
			result.push(line)
		}
	}

	if (strippedEndpoints.length > 0) {
		fs.writeFileSync(filePath, result.join('\n'), 'utf-8')
		results.push({ file, endpoints: strippedEndpoints })
	}
}

if (results.length > 0) {
	console.info('Cleared invalidatesTags for:')
	for (const { file, endpoints } of results) {
		console.info(`  ${file}: ${endpoints.join(', ')}`)
	}
} else {
	console.info('No endpoints matched for invalidation stripping.')
}
