import { createFileRoute } from '@tanstack/react-router'

import { WikiLanding } from '@/app/views/world/views/wiki/landing/WikiLanding'

export const Route = createFileRoute('/world/$worldId/_world/wiki/_wiki/')({
	component: RouteComponent,
})

function RouteComponent() {
	return <WikiLanding />
}
