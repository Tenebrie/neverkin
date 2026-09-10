import { useCallback } from 'react'

import { useRequestImageGenerationMutation } from '@/api/imageGenerationApi'
import { useErrorState } from '@/app/hooks/useErrorState'

export function useImageGeneration() {
	const [requestGeneration, { isLoading: isGenerating }] = useRequestImageGenerationMutation()
	const errorState = useErrorState<{ generationError: string }>()
	const { raiseError, clearError } = errorState

	const generate = useCallback(
		async ({
			prompt,
			model,
			referenceImages,
		}: {
			prompt: string
			model: string
			referenceImages: Array<{ base64: string; mimeType: string }>
		}) => {
			clearError()

			try {
				await requestGeneration({
					body: {
						prompt,
						model,
						referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
					},
				}).unwrap()
			} catch (err: unknown) {
				const message =
					err && typeof err === 'object' && 'data' in err
						? String((err as { data: { message?: string } }).data?.message ?? 'Generation failed')
						: 'Generation failed'
				raiseError('generationError', message)
			}
		},
		[requestGeneration, raiseError, clearError],
	)

	return { generate, isGenerating, errorState: errorState.errorState }
}
