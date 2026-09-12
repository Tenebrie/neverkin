import { createFileRoute } from '@tanstack/react-router'

import { AdminUserView } from '@/app/views/admin/views/AdminUserView'

export const Route = createFileRoute('/admin/$userId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { userId } = Route.useParams()
	return <AdminUserView userId={userId} />
}
