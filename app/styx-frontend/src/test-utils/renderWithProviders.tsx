import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, renderHook, RenderHookOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Fragment, ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { routeTree } from '@/routeTree.gen'

import { generateStore, RootState } from '../app/store'

const createTestRouter = (initialPath: string = '/') => {
	const history = createMemoryHistory({
		initialEntries: [initialPath],
	})

	return createRouter({
		routeTree,
		history,
		defaultPreload: 'intent',
	})
}

export const renderWithProviders = (
	node: ReactNode,
	{ preloadedState }: { preloadedState?: Partial<RootState> } = {},
) => {
	const store = generateStore({ preloadedState })
	return {
		user: userEvent.setup(),
		store,
		...render(<ReduxProvider store={store}>{node}</ReduxProvider>),
	}
}

export const renderWithRouter = async (
	path: string,
	{ preloadedState }: { preloadedState?: Partial<RootState> } = {},
) => {
	const store = generateStore({ preloadedState })
	const router = createTestRouter(path)

	const returnValue = {
		user: userEvent.setup(),
		store,
		router,
		...render(
			<ReduxProvider store={store}>
				<RouterProvider router={router} />
			</ReduxProvider>,
		),
	}

	await act(async () => {
		await router.load()
	})

	return returnValue
}

export const renderHookWithProviders = <Result, Props>(
	hook: (initialProps: Props) => Result,
	{
		preloadedState,
		wrapper: Wrapper = Fragment,
		...options
	}: RenderHookOptions<Props> & { preloadedState?: Partial<RootState> } = {},
) => {
	const store = generateStore({ preloadedState })
	const router = createTestRouter()
	return renderHook(hook, {
		...options,
		wrapper: ({ children }) => (
			<ReduxProvider store={store}>
				<RouterProvider router={router} />
				<Wrapper>{children}</Wrapper>
			</ReduxProvider>
		),
	})
}
