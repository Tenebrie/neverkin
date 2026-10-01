import z from 'zod'

import usePersistentStateRef from '@/app/hooks/usePersistentStateRef'

import { useCurrentWorldId } from '../../../../hooks/useCurrentWorldId'

export function useMindmapCameraPersistence() {
	const worldId = useCurrentWorldId()
	const defaultCamera = { worldId: '', center: { x: 0, y: 0 }, scale: 1 }
	return usePersistentStateRef(
		'mindmapCamera',
		z
			.object({
				worldId: z.string(),
				center: z.object({
					x: z.number(),
					y: z.number(),
				}),
				scale: z.number().min(0),
			})
			.transform((camera) => (camera.worldId === worldId ? camera : defaultCamera)),
		defaultCamera,
		sessionStorage,
	)
}
