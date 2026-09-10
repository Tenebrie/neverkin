import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { useRouter } from '@tanstack/react-router'
import { ReactNode, useCallback } from 'react'

import { useListWorldAccessModesQuery } from '@/api/otherApi'
import { WorldAccessMode, WorldBrief, WorldDetails } from '@/api/types/worldTypes'
import { useSetWorldAccessModeMutation } from '@/api/worldDetailsApi'

type Props = {
	world: WorldDetails
}

const translations: Record<WorldAccessMode, ReactNode> = {
	Private: (
		<span>
			<b>Private:</b> <>Only invited users can see</>
		</span>
	),
	PublicRead: (
		<span>
			<b>Public Share:</b> <>Anyone with a link can see</>
		</span>
	),
	PublicEdit: (
		<span>
			<b>Public Wiki:</b> <>Any logged in user can edit</>
		</span>
	),
}

export const AccessModeSection = ({ world }: Props) => {
	const { data: accessModes } = useListWorldAccessModesQuery()
	const [setWorldAccessMode] = useSetWorldAccessModeMutation()

	const onSelectionChanged = useCallback(
		(value: WorldBrief['accessMode']) => {
			setWorldAccessMode({
				worldId: world.id,
				body: {
					access: value,
				},
			})
		},
		[setWorldAccessMode, world.id],
	)

	const router = useRouter()
	const onCopyLink = useCallback(() => {
		const { href } = router.buildLocation({ to: '/world/$worldId', params: { worldId: world.id } })
		navigator.clipboard.writeText(window.location.origin + href)
	}, [router, world.id])

	return (
		<Stack gap={2}>
			<FormControl fullWidth>
				<InputLabel id="world-calendar-label">Access</InputLabel>
				<Select
					value={world.accessMode}
					label="Access"
					labelId="world-access-mode"
					onChange={(event) => onSelectionChanged(event.target.value as WorldAccessMode)}
				>
					{accessModes &&
						accessModes.map((option) => (
							<MenuItem key={option} value={option}>
								{translations[option]}
							</MenuItem>
						))}
					{!accessModes && <MenuItem value={world.accessMode}>{translations[world.accessMode]}</MenuItem>}
				</Select>
			</FormControl>
			{world.accessMode !== 'Private' && <Button onClick={onCopyLink}>Copy Link to Clipboard</Button>}
		</Stack>
	)
}
