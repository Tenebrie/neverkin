import {
	CalendarPresentationUnitUncheckedCreateInput,
	CalendarPresentationUnitUncheckedUpdateManyInput,
	TransactionClient,
} from '../../prisma/client/internal/prismaNamespace.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { makeTouchCalendarQuery } from './dbQueries/makeTouchCalendarQuery.js'

export const CalendarPresentationService = {
	createCalendarPresentation: async ({
		calendarId,
		params,
	}: {
		calendarId: string
		params: {
			name: string
			scaleFactor?: number
		}
	}) => {
		const presentation = await getPrismaClient().$transaction(async (dbClient) => {
			const presentation = await dbClient.calendarPresentation.create({
				data: {
					name: params.name,
					scaleFactor: params.scaleFactor ?? 1.0,
					calendarId,
				},
				include: {
					units: true,
				},
			})

			await makeTouchCalendarQuery(calendarId, dbClient)
			return presentation
		})

		return { presentation }
	},

	updateCalendarPresentation: async ({
		calendarId,
		presentationId,
		params,
	}: {
		calendarId: string
		presentationId: string
		params: {
			name?: string
			compression?: number
			baselineUnitId?: string | null
		}
	}) => {
		const presentation = await getPrismaClient().$transaction(async (dbClient) => {
			await dbClient.calendarPresentation.update({
				where: {
					calendarId_id: { calendarId, id: presentationId },
				},
				data: {
					name: params.name,
					compression: params.compression,
					baselineUnitId: params.baselineUnitId,
				},
			})

			await CalendarPresentationService.computePresentationFactor({ calendarId, presentationId, dbClient })

			const updatedPresentation = await dbClient.calendarPresentation.findUniqueOrThrow({
				where: {
					calendarId_id: { calendarId, id: presentationId },
				},
				include: {
					units: true,
				},
			})

			await makeTouchCalendarQuery(calendarId, dbClient)
			return updatedPresentation
		})

		return { presentation }
	},

	computePresentationFactor: async ({
		calendarId,
		presentationId,
		dbClient,
	}: {
		calendarId: string
		presentationId: string
		dbClient: TransactionClient
	}) => {
		const existingPresentation = await dbClient.calendarPresentation.findUniqueOrThrow({
			where: {
				calendarId_id: { calendarId, id: presentationId },
			},
			include: {
				units: {
					include: {
						unit: {
							select: {
								duration: true,
							},
						},
					},
				},
				baselineUnit: true,
			},
		})
		const scaleFactor = (() => {
			if (existingPresentation.baselineUnit) {
				return existingPresentation.baselineUnit.duration
			}
			if (existingPresentation.units.length === 0) {
				return 1
			}
			const sortedUnits = [...existingPresentation.units].sort(
				(a, b) => Number(a.unit.duration) - Number(b.unit.duration),
			)
			return sortedUnits[0].unit.duration
		})()

		const factor = Number(scaleFactor) * existingPresentation.compression

		await dbClient.calendarPresentation.update({
			where: {
				calendarId_id: { calendarId, id: presentationId },
			},
			data: {
				scaleFactor: factor,
			},
			include: {
				units: true,
			},
		})

		await makeTouchCalendarQuery(calendarId, dbClient)
	},

	deleteCalendarPresentation: async ({
		calendarId,
		presentationId,
	}: {
		calendarId: string
		presentationId: string
	}) => {
		const presentation = await getPrismaClient().$transaction(async (dbClient) => {
			const presentation = await dbClient.calendarPresentation.delete({
				where: {
					calendarId_id: { calendarId, id: presentationId },
				},
			})

			await makeTouchCalendarQuery(calendarId, dbClient)
			return presentation
		})

		return { presentation }
	},

	computeCalendarPresentationFactors: async ({
		calendarId,
		dbClient,
	}: {
		calendarId: string
		dbClient: TransactionClient
	}) => {
		const presentations = await dbClient.calendarPresentation.findMany({
			where: {
				calendarId,
			},
		})

		for (const presentation of presentations) {
			await CalendarPresentationService.computePresentationFactor({
				calendarId,
				presentationId: presentation.id,
				dbClient,
			})
		}
	},

	createCalendarPresentationUnit: async ({
		calendarId,
		presentationId,
		params,
	}: {
		calendarId: string
		presentationId: string
		params: Omit<CalendarPresentationUnitUncheckedCreateInput, 'calendarId' | 'presentationId'>
	}) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			const unit = await dbClient.calendarPresentationUnit.create({
				data: {
					...params,
					calendarId,
					presentationId,
				},
			})

			await CalendarPresentationService.computeCalendarPresentationUnitPositions({
				calendarId,
				presentationId: unit.presentationId,
				dbClient,
			})

			await makeTouchCalendarQuery(calendarId, dbClient)

			return unit
		})

		return { unit }
	},

	updateCalendarPresentationUnit: async ({
		calendarId,
		unitId,
		params,
	}: {
		calendarId: string
		unitId: string
		params: Omit<CalendarPresentationUnitUncheckedUpdateManyInput, 'calendarId' | 'presentationId' | 'unitId'>
	}) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			const unit = await dbClient.calendarPresentationUnit.update({
				where: {
					calendarId_id: {
						id: unitId,
						calendarId,
					},
				},
				data: params,
			})

			await CalendarPresentationService.computeCalendarPresentationUnitPositions({
				calendarId,
				presentationId: unit.presentationId,
				dbClient,
			})

			await makeTouchCalendarQuery(calendarId, dbClient)
			return unit
		})

		return { unit }
	},

	deleteCalendarPresentationUnit: async ({ calendarId, unitId }: { calendarId: string; unitId: string }) => {
		const unit = await getPrismaClient().$transaction(async (dbClient) => {
			const unit = await dbClient.calendarPresentationUnit.delete({
				where: {
					calendarId_id: {
						id: unitId,
						calendarId,
					},
				},
			})

			await CalendarPresentationService.computeCalendarPresentationUnitPositions({
				calendarId,
				presentationId: unit.presentationId,
				dbClient,
			})

			await makeTouchCalendarQuery(calendarId, dbClient)
			return unit
		})

		return { unit }
	},

	computeCalendarPresentationUnitPositions: async ({
		calendarId,
		presentationId,
		dbClient,
	}: {
		calendarId: string
		presentationId: string
		dbClient: TransactionClient
	}) => {
		const units = await dbClient.calendarPresentationUnit.findMany({
			where: {
				calendarId,
				presentationId,
			},
			orderBy: {
				position: 'asc',
			},
		})

		const unitDurations = await dbClient.calendarUnit.findMany({
			where: {
				calendarId,
			},
			select: { id: true, duration: true },
		})

		const durationMap = new Map(unitDurations.map((u) => [u.id, u.duration]))

		// Sort units by duration (descending - largest first)
		const sortedUnits = [...units].sort((a, b) => {
			const durationA = durationMap.get(a.unitId) ?? 0
			const durationB = durationMap.get(b.unitId) ?? 0
			return Number(durationB) - Number(durationA)
		})

		for (let i = 0; i < sortedUnits.length; i++) {
			const unit = sortedUnits[i]
			await dbClient.calendarPresentationUnit.update({
				where: {
					calendarId_id: { calendarId, id: unit.id },
				},
				data: {
					position: i * 2,
				},
			})
		}
	},
}
