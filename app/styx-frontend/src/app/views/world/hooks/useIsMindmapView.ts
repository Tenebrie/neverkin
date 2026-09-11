import { useMatchRoute } from '@tanstack/react-router'

export function useIsMindmapView() {
	const matchRoute = useMatchRoute()
	return matchRoute({ to: '/world/$worldId/mindmap' }) !== false
}
