import { createFileRoute } from '@tanstack/react-router'

import { WikiArticleView } from '@/app/views/world/views/wiki/WikiArticleView'

export const Route = createFileRoute('/world/$worldId/_world/wiki/_wiki/$articleId')({
	component: RouteComponent,
})

function RouteComponent() {
	return <WikiArticleView />
}
