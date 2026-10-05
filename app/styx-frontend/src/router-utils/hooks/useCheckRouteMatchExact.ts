import { useMatches } from '@tanstack/react-router'

import type { FileRouteTypes } from '@/routeTree.gen'

export const useCheckRouteMatchExact = (route: FileRouteTypes['fullPaths']) => {
	return useMatches({
		select: (a) => a.some((b) => b.routeId === route),
	})
}
