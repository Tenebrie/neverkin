// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from '@rstest/core'
import { screen, within } from '@testing-library/react'

import {
	mockAddCollaborator,
	mockCollaboratingUser,
	mockGetWorldBrief,
	mockGetWorldCollaborators,
	mockListWorldAccessModes,
	mockRemoveCollaborator,
	mockWorldBriefModel,
} from '@/api/mock/rheaApi.mock'
import { ShareWorldApiArg } from '@/api/worldCollaboratorsApi'
import { worldInitialState } from '@/app/views/world/WorldSlice'
import { mockRouter } from '@/router-utils/router.mock'
import { renderWithProviders } from '@/test-utils/renderWithProviders'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { SettingsView } from './SettingsView'

const server = setupTestServer()

describe.skip('<Settings />', () => {
	const preloadedState = {
		preloadedState: {
			world: {
				...worldInitialState,
				id: 'world-1111',
			},
		},
	}

	beforeAll(() => {
		mockRouter(homeRoutes.worldDetails, { worldId: 'world-1111' })
	})

	describe('collaborators', () => {
		beforeEach(() => {
			mockListWorldAccessModes(server, {
				response: ['Private', 'PublicEdit', 'PublicRead'],
			})

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})

			mockGetWorldCollaborators(server, {
				worldId: 'world-1111',
				response: [],
			})
		})

		it('renders empty state for collaborators by default', async () => {
			renderWithProviders(<SettingsView />, preloadedState)

			expect(await screen.findByText('No collaborators added')).toBeInTheDocument()
		})

		it("displays collaborator's email", async () => {
			renderWithProviders(<SettingsView />, preloadedState)

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})

			mockGetWorldCollaborators(server, {
				worldId: 'world-1111',
				response: [
					mockCollaboratingUser({
						user: {
							email: 'test@localhost',
						},
					}),
				],
			})

			expect(await screen.findByText('test@localhost')).toBeInTheDocument()
			expect(screen.queryByText('No collaborators added')).not.toBeInTheDocument()
		})

		it('invites a new collaborator', async () => {
			const { user } = renderWithProviders(
				<>
					<SettingsView />
				</>,
				preloadedState,
			)

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})

			const { invocations } = mockAddCollaborator(server, { worldId: 'world-1111', response: null })

			await user.click(await screen.findByText('Share world with specific people...'))
			await user.click(await screen.findByLabelText('Emails'))
			await user.keyboard('user@localhost{enter}')
			await user.click(await screen.findByText('Confirm'))

			expect(invocations.length).toEqual(1)
			expect(invocations[0].jsonBody).toEqual({
				access: 'ReadOnly',
				userEmails: ['user@localhost'],
			} satisfies ShareWorldApiArg['body'])
		})

		it('invites a new collaborator with changed access level', async () => {
			const { user } = renderWithProviders(
				<>
					<SettingsView />
				</>,
				preloadedState,
			)

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})

			const { invocations } = mockAddCollaborator(server, { worldId: 'world-1111', response: null })

			await user.click(await screen.findByText('Share world with specific people...'))
			await user.click(await screen.findByLabelText('Emails'))
			await user.keyboard('user@localhost{enter}')

			await user.click(screen.getByLabelText('Access'))
			await user.click(within(screen.getByRole('listbox')).getByText('Editing'))

			await user.click(await screen.findByText('Confirm'))

			expect(invocations.length).toEqual(1)
			expect(invocations[0].jsonBody).toEqual({
				access: 'Editing',
				userEmails: ['user@localhost'],
			} satisfies ShareWorldApiArg['body'])
		})

		it('removes a collaborator', async () => {
			const { user } = renderWithProviders(<SettingsView />, preloadedState)

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})

			mockGetWorldCollaborators(server, {
				worldId: 'world-1111',
				response: [
					mockCollaboratingUser({
						user: {
							id: 'user-1111',
							email: 'user@localhost',
						},
					}),
				],
			})

			const { hasBeenCalled } = mockRemoveCollaborator(server, {
				worldId: 'world-1111',
				userId: 'user-1111',
				response: null,
			})

			const button = await screen.findByLabelText(
				'Remove user@localhost from collaborators. Requires double click.',
			)
			await user.click(button)
			await user.click(button)

			expect(hasBeenCalled()).toBeTruthy()
		})

		it('cancels removal request', async () => {
			const { user } = renderWithProviders(<SettingsView />, preloadedState)

			mockGetWorldBrief(server, {
				worldId: 'world-1111',
				response: mockWorldBriefModel({
					id: 'world-1111',
				}),
			})
			mockGetWorldCollaborators(server, {
				worldId: 'world-1111',
				response: [
					mockCollaboratingUser({
						user: {
							id: 'user-1111',
							email: 'user@localhost',
						},
					}),
				],
			})

			const { hasBeenCalled } = mockRemoveCollaborator(server, {
				worldId: 'world-1111',
				userId: 'user-1111',
				response: null,
			})

			const removeCollaboratorButton = await screen.findByLabelText(
				'Remove user@localhost from collaborators. Requires double click.',
			)
			await user.click(removeCollaboratorButton)
			await user.click(await screen.findByLabelText('Cancel removing user@localhost from collaborators.'))
			await user.click(removeCollaboratorButton)

			expect(hasBeenCalled()).toBeFalsy()
		})
	})
})
