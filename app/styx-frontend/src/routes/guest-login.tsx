import { createFileRoute } from '@tanstack/react-router'

import { GuestLoginView } from '@/app/views/guest-login/GuestLoginView'

export const Route = createFileRoute('/guest-login')({
	component: RouteComponent,
})

function RouteComponent() {
	return <GuestLoginView />
}
