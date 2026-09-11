import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState } from 'react'

import {
	ListWorldShareLinksApiResponse,
	useDeleteWorldShareLinkMutation,
	useExpireWorldShareLinkMutation,
} from '@/api/otherApi'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { ConfirmPopoverButton } from '@/ui-lib/components/PopoverButton/ConfirmPopoverButton'

type Props = {
	worldId: string
	links: ListWorldShareLinksApiResponse
}

export function ShareLinksSection({ worldId, links }: Props) {
	const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

	const { open: openShareWorldModal } = useModal('shareWorldModal')
	const [revokeLink] = useExpireWorldShareLinkMutation()
	const [deleteLink] = useDeleteWorldShareLinkMutation()

	const copyLink = (slug: string) => {
		const origin = window.location.origin.replace('//app.', '//')
		navigator.clipboard.writeText(`${origin}/share/${slug}`)
		setCopiedSlug(slug)
		setTimeout(() => setCopiedSlug(null), 2000)
	}

	const handleRevokeLink = (link: (typeof links)[number]) => {
		revokeLink({
			worldId,
			shareLinkId: link.id,
		})
	}

	const handleDeleteLink = (link: (typeof links)[number]) => {
		deleteLink({
			worldId,
			shareLinkId: link.id,
		})
	}

	const onShareWorld = useCallback(() => {
		openShareWorldModal({
			worldId,
		})
	}, [openShareWorldModal, worldId])

	const sortedLinks = useMemo(() => {
		return [...links].sort((a, b) => {
			const aExpired = a.expiresAt ? new Date(a.expiresAt) < new Date() : false
			const bExpired = b.expiresAt ? new Date(b.expiresAt) < new Date() : false

			if (aExpired && !bExpired) {
				return 1
			}
			if (!aExpired && bExpired) {
				return -1
			}
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		})
	}, [links])

	return (
		<Stack gap={2}>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Stack>
					<Typography variant="subtitle1" color="text.secondary">
						Share links
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Invite your collaborators
					</Typography>
				</Stack>
				<Button variant="outlined" onClick={onShareWorld} size="small" startIcon={<AddIcon />}>
					Create new share link
				</Button>
			</Stack>
			{sortedLinks.length === 0 && (
				<Typography variant="body2" color="text.secondary">
					<b>Nothing shared yet!</b>
				</Typography>
			)}
			{sortedLinks.map((link) => {
				const origin = window.location.origin.replace('//app.', '//')
				const url = `${origin}/share/${link.slug}`
				const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false

				const createdAt = formatTimeAgo(new Date(link.createdAt))
				const expiresAt = link.expiresAt ? formatTimeAgo(new Date(link.expiresAt)) : null

				return (
					<Paper
						key={link.slug}
						variant="outlined"
						sx={{
							p: 2,
							opacity: isExpired ? 0.6 : 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 2,
						}}
					>
						<Stack gap={0.5} sx={{ minWidth: 0 }}>
							<Stack direction="row" alignItems="center" gap={1}>
								<Typography variant="subtitle2" noWrap>
									{link.label}
								</Typography>
								<Chip
									label={link.accessMode}
									size="small"
									variant="outlined"
									color={isExpired ? 'default' : link.accessMode === 'Editing' ? 'error' : 'success'}
								/>
								{isExpired && <Chip label="Expired" size="small" color="error" />}
							</Stack>
							<Typography
								variant="body2"
								color="text.secondary"
								noWrap
								sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
							>
								{url}
							</Typography>
							<Stack gap={0}>
								<Typography variant="caption" color="text.secondary">
									Created {createdAt}
								</Typography>
								{link.expiresAt && (
									<Typography variant="caption" color="text.secondary">
										{isExpired ? 'Expired' : 'Expires'} {expiresAt}
									</Typography>
								)}
								{link.usageCount > 0 && (
									<Typography variant="caption" color="text.secondary">
										This link has been used {link.usageCount} {link.usageCount === 1 ? 'time' : 'times'}
									</Typography>
								)}
							</Stack>
						</Stack>

						<Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
							<Tooltip title={copiedSlug === link.slug ? 'Copied!' : 'Copy link'}>
								<IconButton size="small" onClick={() => copyLink(link.slug)}>
									{copiedSlug === link.slug ? (
										<CheckIcon fontSize="small" />
									) : (
										<ContentCopyIcon fontSize="small" />
									)}
								</IconButton>
							</Tooltip>
							{!isExpired && (
								<ConfirmPopoverButton
									type="expire"
									tooltip="Expire link"
									prompt="Are you sure you want to expire this link? This will prevent anyone from using it to access the world."
									onConfirm={() => handleRevokeLink(link)}
								/>
							)}
							{isExpired && (
								<ConfirmPopoverButton
									type="delete"
									tooltip="Delete link"
									prompt="Are you sure you want to permanently remove this link from this list?"
									onConfirm={() => handleDeleteLink(link)}
								/>
							)}
						</Stack>
					</Paper>
				)
			})}
		</Stack>
	)
}
