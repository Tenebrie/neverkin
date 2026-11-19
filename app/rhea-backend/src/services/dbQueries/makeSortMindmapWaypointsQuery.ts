import { Prisma } from '@prisma/client'

import { getPrismaClient } from '../dbClients/DatabaseClient.js'

export async function makeSortMindmapWaypointsQuery(linkId: string, prisma?: Prisma.TransactionClient) {
	prisma = getPrismaClient(prisma)

	const waypoints = await prisma.mindmapLinkWaypoint.findMany({
		where: {
			linkId,
		},
		orderBy: {
			index: 'asc',
		},
		select: {
			id: true,
		},
	})

	return Promise.all(
		waypoints.map((waypoint, index) => {
			return prisma.mindmapLinkWaypoint.update({
				where: {
					id: waypoint.id,
				},
				data: {
					index: index * 2,
				},
			})
		}),
	)
}
