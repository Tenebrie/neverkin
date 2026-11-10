import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CreateAccountApiResponse } from '@/api/authApi'

export type User = CreateAccountApiResponse['user']

export const initialState = {
	user: null as User | null,
	sessionId: undefined as string | undefined,
	showRheaConnectionAlert: false as boolean,
	showCalliopeConnectionAlert: false as boolean,
}

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setUser: (state, { payload }: PayloadAction<User>) => {
			state.user = payload
		},
		updateUser: (state, { payload }: PayloadAction<Partial<User>>) => {
			if (state.user) {
				state.user = { ...state.user, ...payload }
			}
		},
		clearUser: (state) => {
			state.user = null
		},
		setSessionId: (state, { payload }: PayloadAction<string>) => {
			state.sessionId = payload
		},
		showCalliopeConnectionAlert: (state) => {
			state.showCalliopeConnectionAlert = true
		},
		hideCalliopeConnectionAlert: (state) => {
			state.showCalliopeConnectionAlert = false
		},
	},
})

export type AuthState = typeof initialState
export const authInitialState = initialState
export const AuthReducer = authSlice.reducer
