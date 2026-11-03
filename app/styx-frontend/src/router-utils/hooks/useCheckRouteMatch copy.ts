import { useMatches } from '@tanstack/react-router'

import type { FileRouteTypes } from '@/routeTree.gen'

export const useCheckRouteMatch = (route: FileRouteTypes['fullPaths']) => {
	return useMatches({
		select: (a) => a.some((a) => a.routeId === route || a.fullPath === route),
	})
}
