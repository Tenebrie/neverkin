import { beforeEach, describe, expect, it } from '@rstest/core'
import { screen } from '@testing-library/react'

import { mockAuthenticatedUser, mockNonAuthenticatedUser, mockPostRegister } from '@/api/mock/rheaApi.mock'
import { renderWithRouter } from '@/test-utils/renderWithProviders'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { authInitialState } from '../../features/auth/AuthSlice'

const server = setupTestServer()

describe('<CreateAccount />', () => {
	describe('with navigation', () => {
		beforeEach(() => {
			mockNonAuthenticatedUser(server)
		})

		it('renders the registration form at the correct path', async () => {
			await renderWithRouter('/create-account')

			expect(screen.getByLabelText('Email')).toBeInTheDocument()
			expect(screen.getByLabelText('Username')).toBeInTheDocument()
			expect(screen.getByLabelText('Password')).toBeInTheDocument()
			expect(screen.getByText('Register')).toBeInTheDocument()
		})

		it("does not render the 'continue to app' alert when not logged in", async () => {
			await renderWithRouter('/create-account')

			expect(screen.queryByText(/It seems you've already logged in/)).not.toBeInTheDocument()
		})

		it("if logged in, renders the 'continue to app' alert", async () => {
			await renderWithRouter('/create-account', {
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

		it('navigates to login on link click', async () => {
			const { user, router } = await renderWithRouter('/create-account')

			await user.click(screen.getByText('Already have an account? Sign in instead'))
			expect(router.state.location.pathname).toEqual('/login')
		})

		it('sends registration request', async () => {
			const { hasBeenCalled } = mockPostRegister(server, {
				response: {
					user: {
						id: '1111-2222-3333',
						email: 'admin@localhost',
						username: 'admin',
						level: 'Free',
						bio: 'Test bio',
						featureFlags: [],
					},
					sessionId: 'sessionId',
				},
			})

			const { user } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Username'), 'admin')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')
			await user.click(screen.getByText('Register'))

			expect(hasBeenCalled()).toBeTruthy()
		})

		it('is redirected to home on successful registration', async () => {
			mockAuthenticatedUser(server)
			mockPostRegister(server, {
				response: {
					user: {
						id: '1111-2222-3333',
						email: 'admin@localhost',
						username: 'admin',
						level: 'Admin',
						bio: 'Test bio',
						featureFlags: [],
					},
					sessionId: 'sessionId',
				},
			})

			const { user, store, router } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Username'), 'admin')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByText('Register'))

			expect(router.state.location.pathname).toEqual('/')
			expect(store.getState().auth.user).toEqual({
				id: '1111-2222-3333',
				email: 'admin@localhost',
				username: 'admin',
				level: 'Admin',
				bio: 'Test bio',
				featureFlags: [],
			})
		})

		it('prints error when email is missing', async () => {
			const { user } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Username'), 'admin')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByText('Register'))

			expect(await screen.findByText('Email is required')).toBeInTheDocument()
		})

		it('prints error when username is missing', async () => {
			const { user } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByText('Register'))

			expect(await screen.findByText('Username is required')).toBeInTheDocument()
		})

		it('prints error when password is missing', async () => {
			const { user } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Username'), 'admin')

			await user.click(screen.getByText('Register'))

			expect(await screen.findByText('Password must be at least 12 characters')).toBeInTheDocument()
		})

		it('prints error when login fails', async () => {
			mockPostRegister(server, {
				error: {
					status: 400,
					message: 'Unable to create account',
				},
			})

			const { user, router } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Username'), 'admin')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByText('Register'))

			expect(await screen.findByText('Unable to create account')).toBeInTheDocument()

			expect(router.state.location.pathname).toEqual('/create-account')
		})

		it('recovers from error when user starts typing', async () => {
			mockPostRegister(server, {
				error: {
					status: 400,
					message: 'Unable to create account',
				},
			})

			const { user } = await renderWithRouter('/create-account')

			await user.type(screen.getByLabelText('Email'), 'admin@localhost')
			await user.type(screen.getByLabelText('Username'), 'admin')
			await user.type(screen.getByLabelText('Password'), 'securepassword123')

			await user.click(screen.getByText('Register'))

			await user.type(screen.getByLabelText('Email'), '111')

			expect(screen.queryByText('Unable to create account')).not.toBeInTheDocument()
		})
	})
})
