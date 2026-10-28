import { describe, expect, it } from '@rstest/core'
import { screen, waitFor } from '@testing-library/react'

import { mockGetWorldColors, mockUpdateMindmapNode } from '@/api/mock/rheaApi.mock'
import { mockMindmapNodeModel } from '@/api/mock/rheaModels.mock'
import { DefaultColors } from '@/app/features/colors/defaultColors'
import { boxPlainNode } from '@/app/views/world/views/wiki/utils/boxEntity'
import { worldInitialState } from '@/app/views/world/WorldSlice'
import { renderWithProviders } from '@/test-utils/renderWithProviders'
import { setupMockWorld } from '@/test-utils/setupMockWorld'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { WikiContextMenuColorPicker } from './WikiContextMenuColorPicker'

describe('WikiContextMenuColorPicker', () => {
	const server = setupTestServer()
	const { worldId } = setupMockWorld()

	it('sends the picked color for a plain mindmap node', async () => {
		const node = mockMindmapNodeModel({ worldId })
		mockGetWorldColors(server, { worldId, response: [] })
		const updateNode = mockUpdateMindmapNode(server, {
			worldId,
			nodeId: node.id,
			response: { ...node, color: DefaultColors.actor },
		})

		const { user } = renderWithProviders(
			<WikiContextMenuColorPicker article={boxPlainNode(node)} onClose={() => {}} />,
			{ preloadedState: { world: { ...worldInitialState, id: worldId } } },
		)
		await user.click(screen.getByTestId('SavedColor/builtin:actor'))

		await waitFor(() =>
			expect(updateNode.invocations).toEqual([{ jsonBody: { color: DefaultColors.actor } }]),
		)
	})
})
