import { CalendarUnit, Prisma } from '@prisma/client'

import {
	CalendarUncheckedCreateInput,
	CalendarUnitCreateManyCalendarInput,
	CalendarUnitUncheckedUpdateWithoutCalendarInput,
	CalendarUpdateInput,
} from '../../prisma/client/models.js'
import { CalendarTemplateIdShape, CalendarTemplateService } from './CalendarTemplateService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { makeSortCalendarUnitsQuery } from './dbQueries/makeSortCalendarUnitsQuery.js'
import { makeTouchCalendarQuery } from './dbQueries/makeTouchCalendarQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import { CommonOrderBy } from './utils/commonOrderBy.js'

export const CalendarService = {
	listUserCalendars: async ({ ownerId }: { ownerId: string }) => {
		return getPrismaClient().calendar.findMany({
			where: {
				ownerId,
				worldId: null,
			},
			orderBy: CommonOrderBy,
		})
	},

	listWorldCalendars: async ({ worldId }: { worldId: string }) => {
		return getPrismaClient().calendar.findMany({
			where: {
				ownerId: null,
				worldId,
			},
			orderBy: CommonOrderBy,
		})
	},

	getCalendarUnitById: async ({ calendarId, unitId }: { calendarId: string; unitId: string }) => {
		return getPrismaClient().calendarUnit.findUniqueOrThrow({
			where: {
				calendarId_id: { calendarId, id: unitId },
			},
		})
	},

	createCalendar: async ({ params }: { params: CalendarUncheckedCreateInput }) => {
		const calendar = await getPrismaClient().calendar.create({
			data: params,
		})

		const world = params.worldId ? await makeTouchWorldQuery(params.worldId) : null

		return {
			calendar,
			world,
		}
	},

	getCalendarUnitCount: async (params: { calendarId: string }) => {
		return getPrismaClient().calendarUnit.count({
			where: {
				calendarId: params.calendarId,
			},
		})
	},

	getEditorCalendar: async ({
		calendarId,
		prisma,
	}: {
		calendarId: string
		prisma?: Prisma.TransactionClient
	}) => {
		const calendar = await getPrismaClient(prisma).calendar.findUniqueOrThrow({
			where: {
				id: calendarId,
			},
			include: {
				units: {
					orderBy: {
						position: 'asc',
					},
					include: {
						parents: {
							orderBy: {
								position: 'asc',
							},
						},
						children: {
							orderBy: {
								position: 'asc',
							},
						},
					},
				},
				presentations: {
					include: {
						units: {
							orderBy: {
								position: 'asc',
							},
						},
					},
					orderBy: {
						scaleFactor: 'asc',
					},
				},
			},
		})

		return {
			...calendar,
		}
	},

	getWorldCalendar: async ({ calendarId }: { calendarId: string }) => {
		const calendar = await getPrismaClient().calendar.findUniqueOrThrow({
			where: {
				id: calendarId,
			},
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
		})
		return {
			...calendar,
			units: CalendarService.formatCalendarUnits(calendar.units),
		}
	},

	updateCalendar: async ({ calendarId, params }: { calendarId: string; params: CalendarUpdateInput }) => {
		const calendar = await getPrismaClient().calendar.update({
			where: {
				id: calendarId,
			},
			data: params,
		})

		return {
			calendar,
		}
	},

	createCalendarUnit: async ({
		calendarId,
		params,
	}: {
		calendarId: string
		params: Omit<CalendarUnitCreateManyCalendarInput, 'calendar'>
	}) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			await dbClient.calendarUnit.create({
				data: {
					...params,
					calendarId,
					position: params.position !== undefined ? params.position * 2 : undefined,
				},
			})

			await CalendarService.computeCalendarUnitDurations({ calendarId }, dbClient)
			await makeTouchCalendarQuery(calendarId, dbClient)

			return dbClient.calendarUnit.findFirstOrThrow({
				where: {
					calendarId,
				},
			})
		})

		return {
			unit,
		}
	},

	updateCalendarUnit: async ({
		calendarId,
		unitId,
		params,
	}: {
		calendarId: string
		unitId: string
		params: Omit<CalendarUnitUncheckedUpdateWithoutCalendarInput, 'calendar' | 'children'> & {
			children:
				| {
						childUnitId: string
						repeats: number
						label?: string | null
						shortLabel?: string | null
				  }[]
				| undefined
		}
	}) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			await dbClient.calendarUnit.update({
				where: {
					calendarId_id: {
						id: unitId,
						calendarId,
					},
				},
				data: {
					...params,
					children: params.children
						? {
								deleteMany: {},
								createMany: {
									data: params.children.map((child, index) => ({
										childUnitId: child.childUnitId,
										label: child.label,
										shortLabel: child.shortLabel,
										repeats: child.repeats,
										position: index * 2,
									})),
								},
							}
						: undefined,
				},
			})

			await CalendarService.computeCalendarUnitDurations({ calendarId }, dbClient)
			if (params.position !== undefined) {
				await makeSortCalendarUnitsQuery(calendarId, dbClient)
			}
			await makeTouchCalendarQuery(calendarId, dbClient)

			return dbClient.calendarUnit.findUniqueOrThrow({
				where: {
					calendarId_id: { calendarId, id: unitId },
				},
				include: {
					children: {
						orderBy: {
							position: 'asc',
						},
					},
				},
			})
		})

		return {
			unit,
		}
	},

	deleteCalendar: async ({
		calendarId,
		prisma,
	}: {
		calendarId: string
		prisma?: Prisma.TransactionClient
	}) => {
		return await getPrismaClient(prisma).calendar.delete({
			where: { id: calendarId },
		})
	},

	deleteCalendarUnit: async ({ calendarId, unitId }: { calendarId: string; unitId: string }) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			await dbClient.calendarPresentation.updateMany({
				where: {
					baselineUnitId: unitId,
				},
				data: {
					baselineUnitId: null,
				},
			})

			const unit = await dbClient.calendarUnit.delete({
				where: {
					calendarId_id: { calendarId, id: unitId },
				},
			})

			await CalendarService.computeCalendarUnitDurations({ calendarId }, dbClient)
			await makeSortCalendarUnitsQuery(calendarId, dbClient)
			await makeTouchCalendarQuery(calendarId, dbClient)
			return unit
		})

		return {
			unit,
		}
	},

	computeCalendarUnitDurations: async (
		{ calendarId }: { calendarId: string },
		dbClient?: Prisma.TransactionClient,
	) => {
		dbClient = dbClient ?? getPrismaClient()

		const allUnits = await dbClient.calendarUnit.findMany({
			where: {
				calendarId,
			},
			include: {
				children: {
					orderBy: {
						position: 'asc',
					},
				},
			},
		})

		const durationCache: Map<string, number> = new Map()

		function getTotalDuration(unit: (typeof allUnits)[number], depth: number): number {
			if (depth > 25) {
				throw new Error('Circular dependency in calendar unit definitions')
			}

			if (durationCache.has(unit.id)) {
				return durationCache.get(unit.id)!
			}

			if (unit.children.length === 0) {
				// Leaf nodes have implicit duration of 1
				durationCache.set(unit.id, 1)
				return 1
			}

			let total = 0
			for (const childRel of unit.children) {
				const childUnit = allUnits.find((u) => u.id === childRel.childUnitId)
				if (childUnit) {
					total += getTotalDuration(childUnit, depth + 1) * childRel.repeats
				}
			}

			durationCache.set(unit.id, total)
			return total
		}

		// Calculate all durations
		for (const unit of allUnits) {
			getTotalDuration(unit, 0)
		}

		const depthCache: Map<string, number> = new Map()

		function propagateDepth(unit: (typeof allUnits)[number], currentDepth: number): void {
			if (currentDepth > 25) {
				throw new Error('Circular dependency in calendar unit definitions')
			}

			const existingDepth = depthCache.get(unit.id) ?? -1
			if (currentDepth <= existingDepth) {
				// Already visited at this depth or deeper, no need to continue
				return
			}

			depthCache.set(unit.id, currentDepth)

			// Propagate to all children
			for (const childRel of unit.children) {
				const childUnit = allUnits.find((u) => u.id === childRel.childUnitId)
				if (childUnit) {
					propagateDepth(childUnit, currentDepth + 1)
				}
			}
		}

		// Start traversal from each unit at depth 0
		for (const unit of allUnits) {
			propagateDepth(unit, 0)
		}

		// Combine results and update database
		const values = allUnits.map((unit) => ({
			unit,
			duration: durationCache.get(unit.id) ?? 1,
			depth: depthCache.get(unit.id) ?? 0,
		}))

		return Promise.all(
			values.map((data) =>
				dbClient.calendarUnit.update({
					where: {
						calendarId_id: { calendarId, id: data.unit.id },
					},
					data: {
						duration: data.duration,
						treeDepth: data.depth,
					},
				}),
			),
		)
	},

	assignCalendarsToWorld: async ({
		prisma,
		worldId,
		calendarsIds,
	}: {
		prisma: Prisma.TransactionClient
		worldId: string
		calendarsIds: string[]
	}) => {
		const world = await prisma.world.findUniqueOrThrow({
			where: {
				id: worldId,
			},
			include: {
				calendars: true,
			},
		})

		const existingCalendarIds = world.calendars.map((c) => c.id)
		const calendarsToRemove = existingCalendarIds.filter((id) => !calendarsIds.includes(id))
		const calendarsToAdd = calendarsIds.filter((id) => !existingCalendarIds.includes(id))

		// Remove unassigned calendars
		for (const existingCalendar of calendarsToRemove) {
			await CalendarService.deleteCalendar({ calendarId: existingCalendar, prisma })
		}

		for (const calendarId of calendarsToAdd) {
			const parsedCalendarId = CalendarTemplateIdShape.safeParse(calendarId)

			if (parsedCalendarId.success) {
				await CalendarTemplateService.createTemplateCalendar({
					worldId,
					templateId: parsedCalendarId.data,
					dbClient: prisma,
				})
				continue
			}

			const existingCalendar = await CalendarService.getEditorCalendar({ calendarId, prisma })

			// If owned by the user, make a deep copy. Otherwise, reassign.
			if (existingCalendar.ownerId !== null) {
				await CalendarService.cloneCalendar({
					calendarId,
					worldId,
					prisma,
				})
			} else {
				await prisma.calendar.update({
					where: {
						id: calendarId,
					},
					data: {
						worldId,
					},
				})
			}
		}
	},

	/**
	 * Clone a calendar with all its units, relations, presentations, and seasons.
	 * With scoped composite keys (calendarId, id), cloning is trivial:
	 * just copy all rows with the same internal IDs under a new calendarId.
	 * No ID remapping needed.
	 */
	cloneCalendar: async ({
		calendarId,
		worldId,
		ownerId,
		name,
		prisma,
	}: {
		calendarId: string
		worldId?: string | null
		ownerId?: string | null
		name?: string
		prisma?: Prisma.TransactionClient
	}) => {
		const tx = getPrismaClient(prisma)

		// 1. Fetch original calendar with all nested relations
		const original = await tx.calendar.findUniqueOrThrow({
			where: { id: calendarId },
			include: {
				units: {
					include: {
						children: true,
					},
					orderBy: { position: 'asc' },
				},
				presentations: {
					include: {
						units: true,
					},
				},
				seasons: {
					include: {
						intervals: true,
					},
					orderBy: { position: 'asc' },
				},
			},
		})

		// 2. Create the new calendar (without relations)
		const newCalendar = await tx.calendar.create({
			data: {
				...original,
				id: undefined,
				name: name ?? original.name,
				units: {},
				seasons: {},
				presentations: {},
				worldId: worldId ?? null,
				ownerId: ownerId ?? null,
			},
		})

		const newCalendarId = newCalendar.id

		// 3. Copy all units
		for (const unit of original.units) {
			await tx.calendarUnit.create({
				data: {
					...unit,
					children: {},
					calendarId: newCalendarId,
				},
			})
		}

		// 4. Copy unit relations
		for (const unit of original.units) {
			for (const childRel of unit.children) {
				await tx.calendarUnitRelation.create({
					data: {
						...childRel,
						calendarId: newCalendarId,
					},
				})
			}
		}

		// 5. Copy presentations
		for (const presentation of original.presentations) {
			await tx.calendarPresentation.create({
				data: {
					...presentation,
					units: {},
					calendarId: newCalendarId,
				},
			})

			// Copy presentation units
			for (const presUnit of presentation.units) {
				await tx.calendarPresentationUnit.create({
					data: {
						...presUnit,
						calendarId: newCalendarId,
					},
				})
			}
		}

		// 6. Copy seasons and their intervals
		for (const season of original.seasons) {
			await tx.calendarSeason.create({
				data: {
					...season,
					intervals: {},
					calendarId: newCalendarId,
				},
			})

			for (const interval of season.intervals) {
				await tx.calendarSeasonInterval.create({
					data: {
						...interval,
						calendarId: newCalendarId,
					},
				})
			}
		}

		// Touch the world if assigned
		const world = newCalendar.worldId ? await makeTouchWorldQuery(newCalendar.worldId, tx) : null

		return {
			calendar: newCalendar,
			world,
		}
	},

	formatCalendarUnit: <
		T extends Pick<CalendarUnit, 'name' | 'displayName' | 'displayNameShort' | 'displayNamePlural'>,
	>(
		unit: T,
	) => {
		return {
			...unit,
			displayName: (unit.displayName || unit.name).trim(),
			displayNameShort: unit.displayNameShort || unit.name.trim().substring(0, 1),
			displayNamePlural: unit.displayNamePlural || unit.name.trim() + 's',
		}
	},

	formatCalendarUnits: <
		T extends Pick<CalendarUnit, 'name' | 'displayName' | 'displayNameShort' | 'displayNamePlural'>,
	>(
		units: T[],
	) => {
		return units.map(CalendarService.formatCalendarUnit)
	},
}
