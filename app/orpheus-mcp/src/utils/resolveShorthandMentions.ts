import { RheaService } from '@src/services/RheaService.js'

import { MENTIONABLE_ENTITY_TYPES, resolveEntityByName } from './resolveEntityByName.js'

function createMentionHtml({ type, id, name }: { type: string; id: string; name: string }): string {
	const componentProps = JSON.stringify({ [type]: id })
	const escapedProps = componentProps
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
	return `<span data-component-props="${escapedProps}" data-type="mention" data-name="${name}"></span>`
}

export async function resolveShorthandMentions({
	content,
	worldData,
	articleData,
}: {
	content: string
	worldData: Awaited<ReturnType<typeof RheaService.getWorldDetails>>
	articleData: Awaited<ReturnType<typeof RheaService.getWorldArticles>>
}): Promise<string> {
	// Match @[...] pattern that is NOT inside an existing HTML tag
	// We need to avoid matching things like data-name="@[Something]"
	const shorthandPattern = /@\[([^\]]+)\]/g

	let result = content
	let match: RegExpExecArray | null

	// Collect all matches first to avoid issues with modifying string while iterating
	const matches: { fullMatch: string; entityName: string; index: number }[] = []
	while ((match = shorthandPattern.exec(content)) !== null) {
		// Check if this match is inside an HTML tag attribute (between < and >)
		const beforeMatch = content.substring(0, match.index)
		const lastOpenTag = beforeMatch.lastIndexOf('<')
		const lastCloseTag = beforeMatch.lastIndexOf('>')

		// If we're inside a tag (last < is after last >), skip this match
		if (lastOpenTag > lastCloseTag) {
			continue
		}

		matches.push({
			fullMatch: match[0],
			entityName: match[1],
			index: match.index,
		})
	}

	// Process matches in reverse order to preserve indices
	for (let i = matches.length - 1; i >= 0; i--) {
		const { fullMatch, entityName } = matches[i]
		const { type, entity } = resolveEntityByName({
			name: entityName,
			types: MENTIONABLE_ENTITY_TYPES,
			worldData,
			articleData,
		})
		result = result.replace(fullMatch, createMentionHtml({ type, id: entity.id, name: entity.name }))
	}

	return result
}
