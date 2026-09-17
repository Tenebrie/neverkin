export function nameMatchesFuzzy({ query, entityName }: { query: string; entityName: string }): boolean {
	return entityName.trim().toLowerCase().includes(query.trim().toLowerCase())
}

export function nameMatchesExactly({ query, entityName }: { query: string; entityName: string }): boolean {
	return entityName.trim().toLowerCase() === query.trim().toLowerCase()
}

export function findByName<T extends { name: string }>({ name, entities }: { name: string; entities: T[] }) {
	const exactMatches = entities.filter((actor) => nameMatchesExactly({ query: name, entityName: actor.name }))
	if (exactMatches.length > 1) {
		throw new Error(`Multiple entities found exactly matching "${name}".`)
	}

	const matchingEntities = entities.filter((actor) =>
		nameMatchesFuzzy({ query: name, entityName: actor.name }),
	)

	if (matchingEntities.length === 0) {
		throw new Error(
			`No entities found matching "${name}". Available: ${entities.map((e) => e.name).join(', ')}`,
		)
	}

	if (matchingEntities.length > 1 && exactMatches.length === 1) {
		return exactMatches[0]
	}

	if (matchingEntities.length > 1 && exactMatches.length === 0) {
		throw new Error(
			`Multiple entities found fuzzy matching "${name}": ${matchingEntities.map((e) => e.name).join(', ')}`,
		)
	}

	return matchingEntities[0]
}

export async function findByNameOrCreate<T extends { name: string }>({
	name,
	entities,
	onCreate,
}: {
	name: string
	entities: T[]
	onCreate: () => Promise<T>
}) {
	const exactMatches = entities.filter((actor) => nameMatchesExactly({ query: name, entityName: actor.name }))
	if (exactMatches.length > 1) {
		throw new Error(`Multiple entities found exactly matching "${name}".`)
	}

	const matchingEntities = entities.filter((actor) =>
		nameMatchesFuzzy({ query: name, entityName: actor.name }),
	)

	if (matchingEntities.length === 0) {
		if (onCreate) {
			return onCreate()
		}
	}

	if (matchingEntities.length > 1 && exactMatches.length === 1) {
		return exactMatches[0]
	}

	if (matchingEntities.length > 1 && exactMatches.length === 0) {
		throw new Error(
			`Multiple entities found fuzzy matching "${name}": ${matchingEntities.map((e) => e.name).join(', ')}`,
		)
	}

	return matchingEntities[0]
}
