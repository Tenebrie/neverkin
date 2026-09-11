import { useCallback, useMemo } from 'react'
import { z } from 'zod'

import usePersistentState from '@/app/hooks/usePersistentState'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'
import { WikiLintFinding, WikiLintRule } from './WikiLintRule'
import { WIKI_LINT_RULES } from './wikiLintRules'

export type LooseThread = WikiLintFinding & { icon: WikiLintRule['icon'] }

export function useLooseThreads(entities: BoxedWikiEntity[]) {
	const [dismissed, setDismissed] = usePersistentState(
		'wikiDismissedThreads',
		z.array(z.string()),
		[],
		sessionStorage,
	)

	const threads = useMemo(
		() =>
			WIKI_LINT_RULES.flatMap((rule) =>
				rule
					.check(entities)
					.filter((finding) => !dismissed.includes(finding.key))
					.map((finding) => ({ ...finding, icon: rule.icon })),
			),
		[entities, dismissed],
	)

	const dismiss = useCallback((key: string) => setDismissed((current) => [...current, key]), [setDismissed])

	return { threads, dismiss }
}
