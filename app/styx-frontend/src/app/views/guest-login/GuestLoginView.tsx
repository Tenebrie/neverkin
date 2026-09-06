import { Icon } from '@iconify/react'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as NavLink } from '@tanstack/react-router'

import { TenebrieLogo } from '@/app/components/TenebrieLogo'
import { useGuestLogin } from '@/app/features/auth/hooks/useGuestLogin'
import { BrandGradient } from '@/ui-lib/components/BrandGradient/BrandGradient'
import { Header } from '@/ui-lib/components/Header/Header'

export function GuestLoginView() {
	const [handleGuestLogin, { isLoading }] = useGuestLogin()

	return (
		<Container
			maxWidth="xs"
			sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
		>
			<Paper
				sx={{ p: 4, width: '100%', border: (theme) => `1px solid ${theme.palette.divider}` }}
				elevation={1}
			>
				<Stack gap={3} alignItems="center" textAlign="center">
					<TenebrieLogo />

					<Stack gap={2} width="100%">
						<Stack gap={1}>
							<Header variant="h1">
								Welcome to <BrandGradient>Neverkin!</BrandGradient>
							</Header>
						</Stack>
						<Typography variant="body2" color="text.secondary">
							Explore all the features of the app with a single click. No credit cards accepted.
						</Typography>
						<Stack gap={1}>
							<Button
								variant="contained"
								fullWidth
								onClick={handleGuestLogin}
								loading={isLoading}
								startIcon={
									<Icon
										icon="tabler:pencil-heart"
										width={24}
										height={24}
										ssr
										fallback={<span style={{ display: 'inline-block', width: 24, height: 24 }} />}
									/>
								}
							>
								Explore as a guest
							</Button>
							<Typography variant="caption" color="text.disabled">
								Guest accounts are cleaned up after a few days.
							</Typography>
						</Stack>
						<Divider />
						<Typography variant="body2" color="text.secondary">
							Used Neverkin before?{' '}
							<Link component={NavLink} from="/" to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
								Sign in here
							</Link>
						</Typography>
					</Stack>
				</Stack>
			</Paper>
		</Container>
	)
}
