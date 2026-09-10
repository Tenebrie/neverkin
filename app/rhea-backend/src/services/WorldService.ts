import { User, World } from '@prisma/client'
import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'

import { CalendarService } from './CalendarService.js'
import { CalendarTemplateId, CalendarTemplateService } from './CalendarTemplateService.js'

export const WorldService = {
	findWorldByIdInternal: async (worldId: string) => {
		return getPrismaClient().world.findFirst({
			where: {
				id: worldId,
			},
		})
	},

	createWorld: async (params: {
		owner: User
		name: string
		description?: string
		calendars: string[]
		timeOrigin?: number
	}) => {
		return await getPrismaClient().$transaction(async (dbClient) => {
			const world = await dbClient.world.create({
				data: {
					name: params.name,
					description: params.description,
					ownerId: params.owner.id,
					timeOrigin: params.timeOrigin,
				},
				select: {
					id: true,
					name: true,
				},
			})

			await CalendarService.assignCalendarsToWorld({
				worldId: world.id,
				calendarsIds: params.calendars,
				prisma: dbClient,
			})
			return world
		})
	},

	updateWorld: async (params: {
		worldId: string
		data: Pick<Partial<World>, 'name' | 'description' | 'accessMode'> & {
			timeOrigin?: number
			calendars?: string[]
		}
	}) => {
		await getPrismaClient().$transaction(async (prisma) => {
			if (params.data.calendars) {
				await CalendarService.assignCalendarsToWorld({
					worldId: params.worldId,
					calendarsIds: params.data.calendars,
					prisma,
				})
			}

			const { calendars: _, ...data } = params.data

			await prisma.world.update({
				where: {
					id: params.worldId,
				},
				data,
			})
		})
	},

	deleteWorld: async (worldId: string) => {
		return getPrismaClient().world.delete({
			where: {
				id: worldId,
			},
		})
	},

	listOwnedWorlds: async (params: { owner: User }) => {
		return getPrismaClient().world.findMany({
			where: {
				owner: params.owner,
			},
		})
	},

	listAvailableWorlds: async (params: { owner: User }) => {
		const worlds = await getPrismaClient().world.findMany({
			where: {
				OR: [
					{ owner: params.owner },
					{
						collaborators: {
							some: {
								user: params.owner,
							},
						},
					},
				],
			},
			include: {
				collaborators: true,
				calendars: true,
				userPins: {
					where: { userId: params.owner.id },
				},
			},
		})

		const ownedWorlds = worlds.filter((world) => world.ownerId === params.owner.id)

		const contributableWorlds = worlds.filter((world) =>
			world.collaborators.some((user) => user.userId === params.owner.id && user.access === 'Editing'),
		)

		const visibleWorlds = worlds.filter((world) =>
			world.collaborators.some((user) => user.userId === params.owner.id && user.access === 'ReadOnly'),
		)

		return {
			ownedWorlds,
			contributableWorlds,
			visibleWorlds,
		}
	},

	findWorldDetails: async (worldId: string) => {
		const world = await getPrismaClient().world.findFirstOrThrow({
			where: {
				id: worldId,
			},
			include: {
				actors: {
					include: {
						pages: {
							select: {
								id: true,
								name: true,
							},
						},
						mentions: {
							distinct: ['targetId'],
							select: {
								targetId: true,
								targetType: true,
							},
						},
						mentionedIn: {
							distinct: ['sourceId'],
							select: {
								sourceId: true,
								sourceType: true,
							},
						},
					},
				},
				events: {
					orderBy: {
						timestamp: 'asc',
					},
					include: {
						pages: {
							select: {
								id: true,
								name: true,
							},
						},
						mentions: {
							distinct: ['targetId'],
							select: {
								targetId: true,
								targetType: true,
							},
						},
						mentionedIn: {
							distinct: ['sourceId'],
							select: {
								sourceId: true,
								sourceType: true,
							},
						},
						deltaStates: {
							orderBy: {
								timestamp: 'asc',
							},
						},
					},
				},
				calendars: {
					omit: {
						createdAt: true,
						worldId: true,
						ownerId: true,
					},
					include: {
						units: {
							omit: {
								createdAt: true,
								updatedAt: true,
								calendarId: true,
							},
							include: {
								parents: {
									omit: {
										createdAt: true,
										updatedAt: true,
									},
									orderBy: {
										position: 'asc',
									},
								},
								children: {
									omit: {
										createdAt: true,
										updatedAt: true,
									},
									orderBy: {
										position: 'asc',
									},
								},
							},
							orderBy: {
								position: 'asc',
							},
						},
						presentations: {
							omit: {
								createdAt: true,
								updatedAt: true,
								calendarId: true,
							},
							include: {
								units: {
									omit: {
										createdAt: true,
										updatedAt: true,
										presentationId: true,
									},
									orderBy: {
										position: 'asc',
									},
								},
							},
							orderBy: {
								scaleFactor: 'asc',
							},
						},
						seasons: {
							omit: {
								createdAt: true,
								updatedAt: true,
								calendarId: true,
							},
							include: {
								intervals: true,
							},
						},
					},
				},
				tags: {
					include: {
						mentions: {
							distinct: ['targetId'],
							select: {
								targetId: true,
								targetType: true,
							},
						},
						mentionedIn: {
							distinct: ['sourceId'],
							select: {
								sourceId: true,
								sourceType: true,
							},
						},
					},
				},
			},
		})
		if (!world.calendar && !world.calendars) {
			throw new Error('World does not have a calendar assigned')
		}
		return {
			...world,
			calendars: world.calendars.map((calendar) => ({
				...calendar,
				units: CalendarService.formatCalendarUnits(calendar.units),
			})),
		}
	},

	findWorldBrief: async (worldId: string) => {
		return getPrismaClient().world.findFirstOrThrow({
			where: {
				id: worldId,
			},
		})
	},

	migrateLegacyCalendar: async (worldId: string) => {
		await getPrismaClient().$transaction(async (dbClient) => {
			const world = await dbClient.world.findFirst({
				where: {
					id: worldId,
					calendar: {
						not: null,
					},
				},
				include: {
					calendars: true,
				},
			})

			if (!world || !world.calendar) {
				return
			}

			const templateId = ((): CalendarTemplateId => {
				switch (world.calendar) {
					case 'EARTH':
					case 'COUNTUP':
						return 'earth_2023'
					case 'PF2E':
						return 'pf2e_4723'
					case 'RIMWORLD':
						return 'rimworld'
					case 'EXETHER':
						return 'exether'
				}
			})()

			console.info(`Migrating calendar for world ${worldId} from ${world.calendar} to ${templateId}`)

			const { calendar } = await CalendarTemplateService.createTemplateCalendar({
				worldId,
				templateId,
				dbClient,
			})
			await dbClient.calendar.deleteMany({
				where: {
					id: {
						in: world.calendars.map((c) => c.id),
					},
				},
			})
			await dbClient.world.update({
				where: {
					id: worldId,
				},
				data: {
					calendar: null,
					calendars: {
						connect: {
							id: calendar.id,
						},
					},
				},
			})
		})
	},
}
