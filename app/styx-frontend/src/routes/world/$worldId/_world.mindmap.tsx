import { createFileRoute } from '@tanstack/react-router'

import { MindmapView } from '@/app/views/world/views/mindmap/MindmapView'

export const Route = createFileRoute('/world/$worldId/_world/mindmap')({
	component: RouteComponent,
})

function RouteComponent() {
	return <MindmapView />
}
