import { describe, expect, it } from '@rstest/core'
import { screen } from '@testing-library/react'

import { mockActorModel } from '@/api/mock/rheaModels.mock'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

import { ActorAvatar } from './ActorAvatar'

describe('ActorAvatar', () => {
	it("renders the initials for actor with a name with 'the'", () => {
		renderWithProviders(<ActorAvatar actor={mockActorModel({ name: 'Daren the Daringblade' })} />)

		expect(screen.getByText('DD')).toBeInTheDocument()
	})

	it('renders the first two initials for actor with three word name', () => {
		renderWithProviders(<ActorAvatar actor={mockActorModel({ name: 'Actor Bactor Cactor' })} />)

		expect(screen.getByText('AB')).toBeInTheDocument()
	})

	it('renders the initials for an actor with a single word name', () => {
		renderWithProviders(<ActorAvatar actor={mockActorModel({ name: 'Actor' })} />)

		expect(screen.getByText('Ac')).toBeInTheDocument()
	})

	it('renders the color of the actor', () => {
		renderWithProviders(<ActorAvatar actor={mockActorModel({ name: 'Actor', color: '#123456' })} />)

		const bgColor = window.getComputedStyle(screen.getByText('Ac')).backgroundColor
		expect(bgColor).toEqual('rgb(18, 52, 86)')
	})
})
