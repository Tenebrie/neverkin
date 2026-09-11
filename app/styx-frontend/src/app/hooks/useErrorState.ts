import { useCallback, useMemo, useState } from 'react'

type RecordElement<T> = {
	[K in keyof T]: {
		type: K
		data: T[K]
	}
}[keyof T]

export type ErrorState<ErrorListT extends Record<string, unknown>> = {
	error: RecordElement<ErrorListT> | null
	raiseError: <TypeT extends RecordElement<ErrorListT>['type'], DataT extends ErrorListT[TypeT]>(
		type: TypeT,
		data: DataT,
	) => void
	clearError: () => void
}

export const useErrorState = <ErrorListT extends Record<string, unknown>>() => {
	type ErrorElementsT = RecordElement<ErrorListT>
	const [currentError, setCurrentError] = useState<ErrorElementsT | null>(null)

	const raiseError = useCallback(
		<TypeT extends ErrorElementsT['type'], DataT extends ErrorListT[TypeT]>(type: TypeT, data: DataT) => {
			if (currentError && currentError.type === type && currentError.data === data) {
				return
			}
			setCurrentError(() => ({
				type,
				data,
			}))
		},
		[currentError],
	)

	const clearError = useCallback(() => {
		setCurrentError(null)
	}, [])

	const errorState = useMemo(
		() =>
			({
				error: currentError,
				raiseError,
				clearError,
			}) satisfies ErrorState<ErrorListT>,
		[clearError, currentError, raiseError],
	)

	return {
		error: currentError,
		raiseError,
		clearError,
		errorState,
	}
}
