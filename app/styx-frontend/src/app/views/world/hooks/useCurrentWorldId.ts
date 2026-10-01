import { useStrictParams } from '@/router-utils/hooks/useStrictParams'

export function useCurrentWorldId() {
	return useStrictParams({ from: '/world/$worldId/_world', select: (params) => params.worldId })
}
