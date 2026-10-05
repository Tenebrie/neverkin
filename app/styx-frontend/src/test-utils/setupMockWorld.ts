import { beforeEach, rstest } from '@rstest/core'
import { v4 as getRandomId } from 'uuid'

import * as CurrentWorldId from '@/app/views/world/hooks/useCurrentWorldId'

export function setupMockWorld() {
	const worldId = getRandomId()

	beforeEach(() => {
		rstest.spyOn(CurrentWorldId, 'useCurrentWorldId').mockReturnValue(worldId)
	})

	return { worldId }
}
