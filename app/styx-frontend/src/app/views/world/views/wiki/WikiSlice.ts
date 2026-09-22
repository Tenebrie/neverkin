import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { WikiArticle, WikiFolder } from '@/api/types/worldWikiTypes'

export const initialState = {
	articlesLoaded: false,
	foldersLoaded: false,
	articles: [] as WikiArticle[],
	folders: [] as WikiFolder[],
	lastCheckedArticle: null as string | null,
	isBulkSelecting: false as boolean,
	bulkActionArticles: [] as string[],
}

export const wikiSlice = createSlice({
	name: 'worldWiki',
	initialState,
	reducers: {
		addArticles: (state, { payload }: PayloadAction<{ articles: WikiArticle[] }>) => {
			state.articles = state.articles.filter(
				(existing) => !payload.articles.some((payload) => payload.id === existing.id),
			)
			state.articles = [...state.articles, ...payload.articles]
		},
		loadArticles: (
			state,
			{ payload }: PayloadAction<{ articles: WikiArticle[]; articlesLoading: boolean }>,
		) => {
			state.articlesLoaded = !payload.articlesLoading
			state.articles = payload.articles
		},

		loadFolders: (state, { payload }: PayloadAction<{ folders: WikiFolder[]; foldersLoading: boolean }>) => {
			state.foldersLoaded = !payload.foldersLoading
			state.folders = payload.folders
		},

		setLastCheckedArticle: (state, { payload }: PayloadAction<{ article: string | null }>) => {
			state.lastCheckedArticle = payload.article
		},

		setBulkSelecting: (state, { payload }: PayloadAction<boolean>) => {
			state.isBulkSelecting = payload
			state.bulkActionArticles = []
			state.lastCheckedArticle = null
		},

		addToBulkSelection: (state, { payload }: PayloadAction<{ articles: string[] }>) => {
			state.isBulkSelecting = true
			state.bulkActionArticles = [...state.bulkActionArticles, ...payload.articles]
		},

		removeFromBulkSelection: (state, { payload }: PayloadAction<{ articles: string[] }>) => {
			state.bulkActionArticles = state.bulkActionArticles.filter(
				(article) => !payload.articles.includes(article),
			)
		},

		clearBulkSelection: (state) => {
			state.bulkActionArticles = []
			state.lastCheckedArticle = null
		},
	},
})

export type ModalsState = typeof initialState
export const modalsInitialState = initialState
export const WikiReducer = wikiSlice.reducer
