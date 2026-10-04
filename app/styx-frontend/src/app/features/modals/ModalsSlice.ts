import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ActorDetails, WorldEvent, WorldEventDelta, WorldTag } from '@/api/types/worldTypes'
import { isEventObject } from '@/app/utils/isEventObject'

import { User } from '../auth/AuthSlice'

const modals = {
	/* Admin */
	deleteUserModal: {
		isOpen: false as boolean,
		targetUser: null as User | null,
	},
	setPasswordModal: {
		isOpen: false as boolean,
		targetUser: null as User | null,
	},
	featureFlagModal: {
		isOpen: false as boolean,
		targetUser: null as User | null,
	},

	/* Event Tracks */
	eventTracks: {
		isOpen: false as boolean,
	},

	/* World */
	editEventModal: {
		isOpen: false as boolean,
		entityStack: [] as string[],
		creatingNew: null as 'actor' | 'event' | null,
	},
	createEventModal: {
		isOpen: false as boolean,
	},
	createActorModal: {
		isOpen: false as boolean,
	},
	eventWizard: {
		isOpen: false as boolean,
		timestamp: 0 as number,
	},
	deleteActorModal: {
		isOpen: false as boolean,
		target: null as ActorDetails | null,
	},
	deleteEventModal: {
		isOpen: false as boolean,
		target: null as WorldEvent | null,
	},
	deleteTagModal: {
		isOpen: false as boolean,
		target: null as WorldTag | null,
	},
	deleteEventDeltaModal: {
		isOpen: false as boolean,
		target: null as WorldEventDelta | null,
	},
	revokedStatementWizard: {
		isOpen: false as boolean,
		preselectedEventId: '' as string,
	},
	issuedActorStatementWizard: {
		isOpen: false as boolean,
		actor: null as ActorDetails | null,
	},
	timeTravelModal: {
		isOpen: false as boolean,
		startingTime: 0 as number,
		markers: [] as { key: string; eventId: string }[],
	},
	createColorModal: {
		isOpen: false as boolean,
	},

	/* WorldList */
	shareWorldModal: {
		isOpen: false as boolean,
		worldId: '' as string,
	},
	deleteWorldModal: {
		isOpen: false as boolean,
		worldId: '' as string,
		worldName: '' as string,
	},
	leaveWorldModal: {
		isOpen: false as boolean,
		worldId: '' as string,
		worldName: '' as string,
	},

	/* WorldWiki */
	bulkDeleteEntitiesModal: {
		isOpen: false as boolean,
		articles: [] as string[],
	},
	renameFolderModal: {
		isOpen: false as boolean,
		folderId: '' as string,
		folderName: '' as string,
	},

	/* Profile */
	deleteAccountModal: {
		isOpen: false as boolean,
	},
	deleteAssetModal: {
		isOpen: false as boolean,
		assetId: '' as string,
		assetName: '' as string,
	},
} as const

export const initialState = modals

type ValidModals = keyof typeof modals

export const modalsSlice = createSlice({
	name: 'modals',
	initialState,
	reducers: {
		updateModal: <T extends StrongEntryOf<typeof modals>>(
			state: ModalsState,
			{ payload }: PayloadAction<{ id: T['id']; data: T['data'] }>,
		) => {
			state[payload.id] = {
				...state[payload.id],
				...payload.data,
			}
		},

		closeModal: (state, { payload }: PayloadAction<{ id: ValidModals }>) => {
			state[payload.id].isOpen = false
		},
	},
})

export const useModal = <T extends ValidModals>(id: T) => {
	const state = useSelector((state: { modals: ModalsState }) => state.modals[id])
	const pendingOpenFrame = useRef(0)

	const dispatch = useDispatch()
	const open = useCallback(
		(data: Omit<(typeof modals)[T], 'isOpen'>) => {
			const modalData = isEventObject(data) ? {} : data
			cancelAnimationFrame(pendingOpenFrame.current)
			pendingOpenFrame.current = requestAnimationFrame(() => {
				dispatch(
					modalsSlice.actions.updateModal({
						id,
						data: {
							...modalData,
							isOpen: true,
						},
					}),
				)
			})
		},
		[dispatch, id],
	)

	const close = useCallback(() => {
		cancelAnimationFrame(pendingOpenFrame.current)
		dispatch(modalsSlice.actions.closeModal({ id }))
	}, [dispatch, id])

	const closeAndUpdate = useCallback(
		(data: Omit<(typeof modals)[T], 'isOpen'>) => {
			const modalData = isEventObject(data) ? {} : data
			cancelAnimationFrame(pendingOpenFrame.current)
			dispatch(
				modalsSlice.actions.updateModal({
					id,
					data: {
						...modalData,
						isOpen: false,
					},
				}),
			)
		},
		[dispatch, id],
	)

	return {
		open,
		close,
		closeAndUpdate,
		...state,
	}
}

type StrongEntryOf<T> = {
	[K in keyof T]: {
		id: K
		data: T[K]
	}
}[keyof T]

export type ModalsState = typeof initialState
export const modalsInitialState = initialState
export const ModalsReducer = modalsSlice.reducer
