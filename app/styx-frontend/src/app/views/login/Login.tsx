import LoginRounded from '@mui/icons-material/LoginRounded'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as NavLink } from '@tanstack/react-router'
import { z } from 'zod'

import { usePostLoginMutation } from '@/api/authApi'
import { ApiErrorBanner } from '@/app/components/ApiErrorBanner'
import { TenebrieLogo } from '@/app/components/TenebrieLogo'
import { GoogleLoginButton } from '@/app/features/auth/components/GoogleLoginButton'
import { useGuestLogin } from '@/app/features/auth/hooks/useGuestLogin'
import { useHandleUserLogin } from '@/app/features/auth/hooks/useHandleUserLogin'
import { BoundTextField } from '@/app/features/forms/components/BoundTextField'
import { useAppForm } from '@/app/features/forms/useAppForm'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { Info } from '@/ui-lib/components/Info/Info'

import { AlreadyLoggedInAlert } from '../../features/auth/components/AlreadyLoggedInAlert'

export function Login() {
	const [login, loginState] = usePostLoginMutation()

	const handleUserLogin = useHandleUserLogin()
	const [handleGuestLogin] = useGuestLogin()
	const { isMobile } = useMobileLayout()

	const loginForm = useAppForm({
		defaultValues: {
			email: '',
			password: '',
		},
		validators: {
			onSubmit: z.object({
				email: z
					.string()
					.min(1, 'Email is required')
					.regex(/^[^\s@]+@[^\s@]+$/, 'Invalid email address'),
				password: z.string().min(1, 'Password is required'),
			}),
		},
		onSubmit: async (data) => {
			const result = await login({
				body: {
					email: data.value.email,
					password: data.value.password,
				},
			})

			if ('data' in result && result.data) {
				handleUserLogin(result.data)
			}
		},
	})

	useEffectOnce(() => {})

	useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], loginForm.handleSubmit)

	return (
		<Stack justifyContent="safe center" height="100%" alignItems="center">
			<Stack sx={{ maxWidth: isMobile ? 'none' : 500, width: '100%', minHeight: isMobile ? '100%' : 'auto' }}>
				<Paper elevation={1} square={isMobile} sx={{ flexGrow: 1 }}>
					<Stack spacing={2} justifyContent="center" padding={4}>
						<Stack spacing={2} useFlexGap>
							{!isMobile && (
								<>
									<Stack alignItems="center" sx={{ '@media (max-height: 500px)': { display: 'none' } }}>
										<TenebrieLogo />
									</Stack>
									<Divider sx={{ '@media (max-height: 500px)': { display: 'none' } }} />
								</>
							)}
							<Typography variant="h6" align="center" sx={{ padding: 1 }}>
								Sign in to Neverkin
							</Typography>
						</Stack>
						<AlreadyLoggedInAlert parentSpacing={2} />
						<ApiErrorBanner apiState={loginState} />
						<loginForm.AppField name="email">
							{() => (
								<BoundTextField
									id="email"
									autoComplete="username"
									label="Email"
									type="text"
									placeholder="example@neverkin.com"
									autoFocus
									fullWidth
									onChangeCallback={() => {
										if (loginState.isError) {
											loginState.reset()
										}
									}}
								/>
							)}
						</loginForm.AppField>
						<loginForm.AppField name="password">
							{() => (
								<BoundTextField
									id="password"
									autoComplete="current-password"
									label="Password"
									type="password"
									placeholder="Your password"
									fullWidth
									onChangeCallback={() => {
										if (loginState.isError) {
											loginState.reset()
										}
									}}
								/>
							)}
						</loginForm.AppField>
						<Stack spacing={2} alignItems="center">
							<Button
								loading={loginState.isLoading}
								variant="contained"
								onClick={() => {
									loginForm.handleSubmit()
								}}
								loadingPosition="center"
								startIcon={<LoginRounded />}
								fullWidth
							>
								<span>Sign In</span>
							</Button>
							<Stack spacing={1} alignItems="center">
								<Link
									component={NavLink}
									from="/"
									to="/create-account"
									variant="body2"
									sx={{ textDecoration: 'none' }}
								>
									Create a new account
								</Link>
								<Typography variant="body2" color="text.secondary">
									- or -
								</Typography>
								<Stack direction="row" gap={0.5} justifyContent="center" alignItems="center">
									<Link
										component="a"
										variant="body2"
										onClick={(e) => {
											e.preventDefault()
											handleGuestLogin()
										}}
										sx={{ textDecoration: 'none', cursor: 'pointer' }}
									>
										Login as a guest{' '}
									</Link>
									<Info value="Guest account are fully functional, but temporary. You can start exploring the app with a single click." />
								</Stack>
								<GoogleLoginButton />
							</Stack>
						</Stack>
					</Stack>
				</Paper>
			</Stack>
		</Stack>
	)
}
