import { createFileRoute } from '@tanstack/react-router'

import { SettingsView } from '@/app/views/world/views/settings/SettingsView'

export const Route = createFileRoute('/world/$worldId/_world/settings')({
	component: RouteComponent,
})

function RouteComponent() {
	return <SettingsView />
}
