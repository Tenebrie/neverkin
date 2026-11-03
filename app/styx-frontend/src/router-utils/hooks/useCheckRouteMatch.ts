import { useMatches } from '@tanstack/react-router'

import type { FileRouteTypes } from '@/routeTree.gen'

export const useCheckRouteMatch = (route: FileRouteTypes['fullPaths'] | FileRouteTypes['fullPaths'][]) => {
	return useMatches({
		select: (a) =>
			a.some((routeDef) => {
				if (Array.isArray(route)) {
					return route.some((r) => {
						return routeDef.routeId === r || routeDef.fullPath === r
					})
				}
				return routeDef.routeId === route || routeDef.fullPath === route
			}),
	})
}
