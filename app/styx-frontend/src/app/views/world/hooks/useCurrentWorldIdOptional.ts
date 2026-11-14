import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

export function useCurrentWorldIdOptional() {
	return useStrictParams({
		from: '/world/$worldId/_world',
		shouldThrow: false,
		select: (params) => params.worldId,
	})
}
