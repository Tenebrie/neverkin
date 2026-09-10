import debounce from 'lodash.debounce'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useGenerateFreeWorldShareLinkMutation } from '@/api/otherApi'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useShareSlug() {
	const [randomSlug, setRandomSlug] = useState('')
	const [preferredSlug, setPreferredSlug] = useState('')
	const [error, setError] = useState<string | null>(null)
	const worldId = useSelector(getWorldIdState)

	const [generateSlug] = useGenerateFreeWorldShareLinkMutation()

	const currentSlug = useMemo(() => {
		return preferredSlug || randomSlug
	}, [preferredSlug, randomSlug])

	const checkSlugAvailability = useCallback(
		async (slug: string) => {
			const result = parseApiResponse(await generateSlug({ worldId, body: { preferredSlug: slug } }))
			if (result.error) {
				return { slug: null, preferredSlugFree: false }
			}
			return result.response
		},
		[generateSlug, worldId],
	)

	const validate = useCallback(
		async (slug: string) => {
			if (!slug) {
				setPreferredSlug('')
				setError(null)
				return
			}

			const slugRegex = /^[a-zA-Z0-9-_]+$/
			if (!slugRegex.test(slug)) {
				setError('Only letters, numbers, hyphens and underscores are allowed')
				return
			}

			if (slug.length < 4 || slug.length > 64) {
				setError('Custom link must be between 4 and 64 characters')
				return
			}

			setError(null)
			const result = await checkSlugAvailability(slug)
			if (result.preferredSlugFree) {
				setPreferredSlug(slug)
			} else {
				setError('This link is already taken')
			}
		},
		[checkSlugAvailability],
	)

	const validateDebounced = useMemo(() => {
		return debounce(validate, 500)
	}, [validate])

	const reset = useCallback(async () => {
		setPreferredSlug('')
		setError(null)
		const newRandomSlug = Math.random().toString(36).slice(2, 10)
		setRandomSlug(newRandomSlug)
		const result = await checkSlugAvailability(newRandomSlug)
		if (!result.preferredSlugFree && result.slug) {
			setRandomSlug(result.slug)
		}
	}, [checkSlugAvailability])

	useEffectOnce(() => {
		reset()
	})

	return { currentSlug, randomSlug, error, validate: validateDebounced, reset }
}
