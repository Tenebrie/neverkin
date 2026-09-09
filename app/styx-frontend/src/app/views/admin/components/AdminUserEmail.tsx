import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { censorEmail } from '../utils/censorEmail'
import { UserEmailPopoverButton } from './UserEmailPopoverButton'

type Props = {
	user: {
		id: string
		email: string
	}
	editable?: boolean
}

export function AdminUserEmail({ user, editable }: Props) {
	const [emailRevealed, setEmailRevealed] = useState(false)

	return (
		<>
			<Stack gap={1} direction="row" alignItems="center">
				<Link from="/admin" to={`${user.id}`}>
					<b style={{ position: 'relative', display: 'inline-block' }}>
						<span style={{ visibility: emailRevealed ? 'visible' : 'hidden' }}>{user.email}</span>
						{!emailRevealed && (
							<span style={{ position: 'absolute', left: 0, top: 0 }}>{censorEmail(user.email)}</span>
						)}
					</b>
				</Link>
				{emailRevealed && editable && <UserEmailPopoverButton user={user} />}
				{!emailRevealed && (
					<Tooltip title="Reveal email" disableInteractive enterDelay={700}>
						<IconButton size="small" onClick={() => setEmailRevealed(true)} sx={{ p: 0.25 }}>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
				{emailRevealed && !editable && (
					<Tooltip title="Hide email" disableInteractive enterDelay={700}>
						<IconButton size="small" onClick={() => setEmailRevealed(false)} sx={{ p: 0.25 }}>
							<VisibilityOffIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
			</Stack>
		</>
	)
}
