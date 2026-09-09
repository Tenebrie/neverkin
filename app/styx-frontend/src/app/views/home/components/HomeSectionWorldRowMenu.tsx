import Delete from '@mui/icons-material/Delete'
import MoreVert from '@mui/icons-material/MoreVert'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Settings from '@mui/icons-material/Settings'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks'

import { WorldBrief } from '@/api/types/worldTypes'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import { Tooltip } from '@/ui-lib/components/Tooltip'

type Props = {
	world: WorldBrief
	isOwned: boolean
}

export function HomeSectionWorldRowMenu({ world, isOwned }: Props) {
	const popupState = usePopupState({ variant: 'popover', popupId: `world-row-menu-${world.id}` })
	const navigate = useStableNavigate()
	const { open: openDeleteWorldModal } = useModal('deleteWorldModal')

	const trigger = bindTrigger(popupState)

	return (
		<>
			<Tooltip title="More actions">
				<IconButton
					size="small"
					aria-label={`More actions for world "${world.name}"`}
					{...trigger}
					onClick={(event) => {
						event.preventDefault()
						event.stopPropagation()
						trigger.onClick(event)
					}}
					sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
				>
					<MoreVert fontSize="small" />
				</IconButton>
			</Tooltip>
			<Menu
				{...bindMenu(popupState)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{ paper: { sx: { minWidth: 212 } } }}
			>
				<MenuItem
					component="a"
					href={`/world/${world.id}/wiki`}
					target="_blank"
					rel="noreferrer"
					onClick={popupState.close}
				>
					<ListItemIcon>
						<OpenInNew fontSize="small" />
					</ListItemIcon>
					Open in new tab
				</MenuItem>
				{isOwned && (
					<MenuItem
						onClick={() => {
							popupState.close()
							navigate({ to: `/world/${world.id}/settings`, search: true })
						}}
					>
						<ListItemIcon>
							<Settings fontSize="small" />
						</ListItemIcon>
						World settings
					</MenuItem>
				)}
				{isOwned && (
					<MenuItem
						onClick={() => {
							popupState.close()
							openDeleteWorldModal({ worldId: world.id, worldName: world.name })
						}}
						sx={{ color: 'error.main' }}
					>
						<ListItemIcon>
							<Delete fontSize="small" sx={{ color: 'error.main' }} />
						</ListItemIcon>
						Delete world…
					</MenuItem>
				)}
			</Menu>
		</>
	)
}
