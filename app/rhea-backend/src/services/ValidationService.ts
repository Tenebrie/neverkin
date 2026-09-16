import { WorldEvent } from '@prisma/client'
import { definedProps } from '@src/utils/definedProps.js'
import { BadRequestError } from 'moonflower'

import { AuthorizationService } from './AuthorizationService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { WorldEventService } from './WorldEventService.js'

export const ValidationService = {
	isActorValid: async (actorId: string) => {
		const count = await getPrismaClient().actor.count({
			where: {
				id: actorId,
			},
		})
		return count > 0
	},

	isArticleValid: async (articleId: string) => {
		const count = await getPrismaClient().wikiArticle.count({
			where: {
				id: articleId,
			},
		})
		return count > 0
	},

	isEventValid: async (eventId: string) => {
		const count = await getPrismaClient().worldEvent.count({
			where: {
				id: eventId,
			},
		})
		return count > 0
	},

	isEventDeltaStateValid: async (deltaId: string) => {
		const count = await getPrismaClient().worldEventDelta.count({
			where: {
				id: deltaId,
			},
		})
		return count > 0
	},

	isTagValid: async (tagId: string) => {
		const count = await getPrismaClient().tag.count({
			where: {
				id: tagId,
			},
		})
		return count > 0
	},

	isAssetValid: async (assetId: string) => {
		const count = await getPrismaClient().asset.count({
			where: {
				id: assetId,
			},
		})
		return count > 0
	},

	checkActorValidity: async (actorId: string) => {
		const isValid = await ValidationService.isActorValid(actorId)
		if (!isValid) {
			throw new BadRequestError('Actor does not exist')
		}
	},

	checkArticleValidity: async (articleId: string) => {
		const isValid = await ValidationService.isArticleValid(articleId)
		if (!isValid) {
			throw new BadRequestError('Article does not exist')
		}
	},

	checkEventValidity: async (eventId: string) => {
		const isValid = await ValidationService.isEventValid(eventId)
		if (!isValid) {
			throw new BadRequestError('Event does not exist')
		}
	},

	checkEventDeltaStateValidity: async (deltaId: string) => {
		const isValid = await ValidationService.isEventDeltaStateValid(deltaId)
		if (!isValid) {
			throw new BadRequestError('Event delta state does not exist')
		}
	},

	checkTagValidity: async (tagId: string) => {
		const isValid = await ValidationService.isTagValid(tagId)
		if (!isValid) {
			throw new BadRequestError('Tag does not exist')
		}
	},

	checkEventPatchValidity: async (eventId: string, params: Partial<WorldEvent>) => {
		const originalEvent = await WorldEventService.fetchWorldEventWithDetails(eventId)
		const event = {
			...originalEvent,
			...definedProps(params),
		}

		if (event.revokedAt && event.revokedAt <= event.timestamp) {
			throw new BadRequestError('Event cannot be revoked before it is created')
		}
		if (event.deltaStates.some((delta) => delta.timestamp < event.timestamp)) {
			throw new BadRequestError(
				'Unable to retire an event at this timestamp (at least 1 delta state at a later timestamp)',
			)
		}

		const revokedAt = event.revokedAt
		if (revokedAt && event.deltaStates.some((delta) => delta.timestamp > revokedAt)) {
			throw new BadRequestError(
				'Unable to retire an event at this timestamp (at least 1 delta state at a later timestamp)',
			)
		}
	},

	checkIfEventIsRevokableAt: async (eventId: string, timestamp: bigint | null | undefined) => {
		if (timestamp === null || timestamp === undefined) {
			return
		}
		const event = await WorldEventService.fetchWorldEventWithDetails(eventId)
		if (event.deltaStates.some((delta) => delta.timestamp > timestamp)) {
			throw new BadRequestError(
				'Unable to retire an event at this timestamp (at least 1 delta state at a later timestamp)',
			)
		}
	},

	checkIfEventDeltaStateIsCreatableAt: async (
		eventId: string,
		timestamp: bigint,
		excludedDeltaIds: string[] = [],
	) => {
		const event = await WorldEventService.fetchWorldEventWithDetails(eventId)
		if (timestamp < event.timestamp) {
			throw new BadRequestError('Unable to create a delta state before event creation.')
		}
		if (event.revokedAt && timestamp >= event.revokedAt) {
			throw new BadRequestError('Unable to create a delta state after event retirement.')
		}
		if (
			event.deltaStates.some((state) => state.timestamp === timestamp && !excludedDeltaIds.includes(state.id))
		) {
			throw new BadRequestError('Another delta state already exists at this timestamp.')
		}
	},

	checkIfNodeParentListIsValid: async ({
		worldId,
		params,
	}: {
		worldId: string
		params: {
			parentActorId?: string
			parentArticleId?: string
			parentEventId?: string
			parentFolderId?: string
			parentTagId?: string
		}
	}) => {
		let owners = 0
		if (params.parentActorId) {
			owners += 1
			await AuthorizationService.checkEntityWorldOwnership({
				worldId,
				entityId: params.parentActorId,
				entityType: 'actor',
			})
		}
		if (params.parentArticleId) {
			owners += 1
			await AuthorizationService.checkEntityWorldOwnership({
				worldId,
				entityId: params.parentArticleId,
				entityType: 'article',
			})
		}
		if (params.parentEventId) {
			owners += 1
			await AuthorizationService.checkEntityWorldOwnership({
				worldId,
				entityId: params.parentEventId,
				entityType: 'event',
			})
		}
		if (params.parentFolderId) {
			owners += 1
			await AuthorizationService.checkEntityWorldOwnership({
				worldId,
				entityId: params.parentFolderId,
				entityType: 'folder',
			})
		}
		if (params.parentTagId) {
			owners += 1
			await AuthorizationService.checkEntityWorldOwnership({
				worldId,
				entityId: params.parentTagId,
				entityType: 'tag',
			})
		}
		if (owners > 1) {
			throw new BadRequestError('Node must have at most 1 parent')
		}
	},
}
