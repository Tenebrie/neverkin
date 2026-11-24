import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const initialState = {
	pendingReveal: null as { worldId: string; entityId: string } | null,
}

export const mindmapSlice = createSlice({
	name: 'mindmap',
	initialState,
	reducers: {
		setPendingReveal: (state, { payload }: PayloadAction<{ worldId: string; entityId: string } | null>) => {
			state.pendingReveal = payload
		},
	},
})

export type MindmapState = typeof initialState
export const mindmapInitialState = initialState
export const MindmapReducer = mindmapSlice.reducer
