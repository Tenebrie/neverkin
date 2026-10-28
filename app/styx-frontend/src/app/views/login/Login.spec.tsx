import { beforeEach, describe, expect, it } from '@rstest/core'
import { screen } from '@testing-library/react'

import {
	mockAuthenticatedUser,
	mockGetWorlds,
	mockNonAuthenticatedUser,
	mockPostLogin,
} from '@/api/mock/rheaApi.mock'
import { renderWithRouter } from '@/test-utils/renderWithProviders'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { authInitialState } from '../../features/auth/AuthSlice'

const server = setupTestServer()

describe('<Login />', () => {
	describe('with navigation', () => {
		beforeEach(() => {
			mockNonAuthenticatedUser(server)
		})

		it('renders the login form at the correct path', async () => {
			await renderWithRouter('/login')

			expect(screen.getByLabelText('Email')).toBeInTheDocument()
			expect(screen.getByLabelText('Password')).toBeInTheDocument()
			expect(screen.getByText('Sign In')).toBeInTheDocument()
			expect(screen.getByText('Create a new account')).toBeInTheDocument()
		})

		it("does not render the 'continue to app' alert when not logged in", async () => {
			await renderWithRouter('/login')

			expect(screen.queryByText(/It seems you've already logged in/)).not.toBeInTheDocument()
		})

		it("if logged in, renders the 'continue to app' alert", async () => {
			await renderWithRouter('/login', {
				preloadedState: {
					auth: {
						...authInitialState,
						user: {
							id: '1111-2222-3333',
							email: 'admin@localhost',
							username: 'admin',
							level: 'Admin',
							bio: 'Test bio',
							featureFlags: [],
						},
					},
				},
			})

			expect(screen.getByText(/It seems you've already logged in/)).toBeInTheDocument()
		})

		it('navigates to registration on link click', async () => {
			const { user, router } = await renderWithRouter('/login')

			await user.click(screen.getByText('Create a new account'))

			expect(router.state.location.pathname).toEqual('/create-account')
		})

		it('sends login request', async () => {
			const { hasBeenCalled } = mockPostLogin(server, {
				response: {
					user: {
						id: '1111-2222-3333',
						email: 'admin@localhost',
						username: 'admin',
						level: 'Free',
						bio: 'Test bio',
						avatar: null,
						featureFlags: [],
					},
					sessionId: 'sessionId',
				},
			})
			mockGetWorlds(server, {
				response: {
					ownedWorlds: [],
					contributableWorlds: [],
					visibleWorlds: [],
				},
			})

			const { user } = await renderWithRouter('/login')

			const emailInput = screen.getByLabelText('Email')
			const passwordInput = screen.getByLabelText('Password')
			const signInButton = screen.getByRole('button', { name: /sign in/i })

			// Type in the fields
			await user.type(emailInput, 'admin@localhost')
			await user.type(passwordInput, 'securepassword123')

			await user.click(signInButton)

			// Wait for the API call
			expect(hasBeenCalled()).toBeTruthy()
		})

		it('is redirected to home on successful login', async () => {
			mockAuthenticatedUser(server)
			mockPostLogin(server, {
				response: {
					user: {
						id: '1111-2222-3333',
						email: 'admin@localhost',
						username: 'admin',
						level: 'Free',
						bio: 'Test bio',
						avatar: null,
						featureFlags: [],
					},
					sessionId: 'sessionId',
				},
			})
			mockGetWorlds(server, {
				response: {
					ownedWorlds: [],
					contributableWorlds: [],
					visibleWorlds: [],
				},
			})

			const { user, store, router } = await renderWithRouter('/login')

			await user.clear(screen.getByLabelText('Email'))
			await user.clear(screen.getByLabelText('Password'))
			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByRole('button', { name: /sign in/i }))

			expect(router.state.location.pathname).toEqual('/')
			expect(store.getState().auth.user).toBeTruthy()
		})

		it('prints error when email is missing', async () => {
			const { user } = await renderWithRouter('/login')

			await user.type(screen.getByLabelText('Password'), 'securepassword123')
			await user.click(screen.getByText('Sign In'))

			expect(await screen.findByText('Email is required')).toBeInTheDocument()
		})

		it('prints error when password is missing', async () => {
			const { user } = await renderWithRouter('/login')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.click(screen.getByText('Sign In'))

			expect(await screen.findByText('Password is required')).toBeInTheDocument()
		})

		it('prints error when login fails', async () => {
			mockPostLogin(server, {
				error: {
					status: 400,
					message: 'Password invalid',
				},
			})
			mockGetWorlds(server, {
				response: {
					ownedWorlds: [],
					contributableWorlds: [],
					visibleWorlds: [],
				},
			})

			const { user, router } = await renderWithRouter('/login')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')
			await user.click(screen.getByText('Sign In'))

			expect(await screen.findByText('Password invalid')).toBeInTheDocument()

			expect(router.state.location.pathname).toEqual('/login')
		})

		it('recovers from error when user starts typing', async () => {
			mockPostLogin(server, {
				error: {
					status: 400,
					message: 'Password invalid',
				},
			})
			mockGetWorlds(server, {
				response: {
					ownedWorlds: [],
					contributableWorlds: [],
					visibleWorlds: [],
				},
			})

			const { user } = await renderWithRouter('/login')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')
			await user.click(screen.getByText('Sign In'))

			await user.type(screen.getByLabelText('Email'), '111')
			await user.click(screen.getByLabelText('Password'))

			expect(screen.queryByText('Password invalid')).not.toBeInTheDocument()
		})
	})
})
