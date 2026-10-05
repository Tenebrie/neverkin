import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const initialState = {
	pendingRevealEntityId: null as string | null,
}

export const mindmapSlice = createSlice({
	name: 'mindmap',
	initialState,
	reducers: {
		setPendingReveal: (state, { payload }: PayloadAction<string | null>) => {
			state.pendingRevealEntityId = payload
		},
	},
})

export type MindmapState = typeof initialState
export const mindmapInitialState = initialState
export const MindmapReducer = mindmapSlice.reducer
