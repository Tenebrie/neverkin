import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as NavLink, useParams } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useAcceptWorldShareLinkMutation, useVisitWorldShareLinkQuery } from '@/api/otherApi'
import { TenebrieLogo } from '@/app/components/TenebrieLogo'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { setSessionStorageItem } from '@/app/utils/sessionStorage'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

export function WorldShareView() {
	const { shareLinkSlug } = useParams({ from: '/share/$shareLinkSlug' })
	const { user } = useSelector(getAuthState)
	const navigate = useStableNavigate({ from: '/' })

	const { data, isLoading } = useVisitWorldShareLinkQuery({
		slug: shareLinkSlug,
	})

	const [acceptInvitation] = useAcceptWorldShareLinkMutation()

	useEffect(() => {
		if (shareLinkSlug) {
			setSessionStorageItem('visitedShareLinkSlug', shareLinkSlug)
		}
	}, [shareLinkSlug])

	const handleAcceptInvitation = useCallback(async () => {
		const result = parseApiResponse(await acceptInvitation({ slug: shareLinkSlug }))
		if (result.error) {
			return
		}
		setSessionStorageItem('visitedShareLinkSlug', null)
		navigate({ to: '/world/$worldId/wiki', params: { worldId: result.response.world.id } })
	}, [acceptInvitation, navigate, shareLinkSlug])

	if (isLoading) {
		return null
	}

	return (
		<Container
			maxWidth="xs"
			sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
		>
			<Paper sx={{ p: 4, width: '100%' }} elevation={2}>
				<Stack gap={3} alignItems="center" textAlign="center">
					<TenebrieLogo />

					{data ? (
						<>
							<Stack gap={2}>
								<Stack gap={1}>
									<Typography variant="h5">
										{user ? "You've been invited" : 'Welcome to Neverkin!'}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										You have been invited to collaborate on Neverkin!
									</Typography>
								</Stack>
								<Stack gap={0.5}>
									<Typography variant="subtitle1" fontWeight="bold">
										{data.world.name}
									</Typography>
									{data.world.description && (
										<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
											{data.world.description}
										</Typography>
									)}
								</Stack>
							</Stack>

							{user ? (
								<Button variant="contained" onClick={handleAcceptInvitation} fullWidth size="large">
									Accept invitation
								</Button>
							) : (
								<Stack gap={1.5} width="100%">
									<NavLink to="/create-account" style={{ textDecoration: 'none' }}>
										<Button variant="contained" fullWidth>
											Create your free account
										</Button>
									</NavLink>
									<Link
										component={NavLink}
										from="/"
										to="/login"
										variant="body2"
										sx={{ textDecoration: 'none' }}
									>
										Used Neverkin before? Sign in here
									</Link>
								</Stack>
							)}
						</>
					) : (
						<Stack gap={1}>
							<Typography variant="h5">Link not found</Typography>
							<Typography variant="body2" color="text.secondary">
								This invitation link is invalid or has expired.
							</Typography>
						</Stack>
					)}
				</Stack>
			</Paper>
		</Container>
	)
}
