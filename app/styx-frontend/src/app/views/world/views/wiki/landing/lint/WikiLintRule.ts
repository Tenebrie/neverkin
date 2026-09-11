import { ReactNode } from 'react'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'

export type WikiLintFinding = {
	/** Stable across renders; used to remember dismissals. */
	key: string
	entity: BoxedWikiEntity
	label: string
	message: string
	action: string
}

export type WikiLintRule = {
	id: string
	icon: ReactNode
	check: (entities: BoxedWikiEntity[]) => WikiLintFinding[]
}
