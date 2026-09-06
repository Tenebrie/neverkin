import AppRegistrationRounded from '@mui/icons-material/AppRegistrationRounded'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as NavLink } from '@tanstack/react-router'
import { z } from 'zod'

import { useCreateAccountMutation } from '@/api/authApi'
import { ApiErrorBanner } from '@/app/components/ApiErrorBanner'
import { TenebrieLogo } from '@/app/components/TenebrieLogo'
import { getLandingOrigin, GoogleLoginButton } from '@/app/features/auth/components/GoogleLoginButton'
import { useGuestLogin } from '@/app/features/auth/hooks/useGuestLogin'
import { useHandleUserLogin } from '@/app/features/auth/hooks/useHandleUserLogin'
import { BoundTextField } from '@/app/features/forms/components/BoundTextField'
import { useAppForm } from '@/app/features/forms/useAppForm'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { Info } from '@/ui-lib/components/Info/Info'

import { AlreadyLoggedInAlert } from '../../features/auth/components/AlreadyLoggedInAlert'

export const CreateAccount = () => {
	const [createAccount, createAccountState] = useCreateAccountMutation()

	const handleUserLogin = useHandleUserLogin()
	const [handleGuestLogin] = useGuestLogin()

	const registerForm = useAppForm({
		defaultValues: {
			email: '',
			username: '',
			password: '',
		},
		validators: {
			onSubmit: z.object({
				email: z
					.string()
					.min(1, 'Email is required')
					.regex(/^[^\s@]+@[^\s@]+$/, 'Invalid email address'),
				username: z.string().min(1, 'Username is required'),
				password: z.string().min(12, 'Password must be at least 12 characters'),
			}),
		},
		onSubmit: async (data) => {
			const result = await createAccount({
				body: {
					email: data.value.email,
					username: data.value.username,
					password: data.value.password,
				},
			})

			if ('data' in result && result.data) {
				handleUserLogin(result.data)
			}
		},
	})

	useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], registerForm.handleSubmit)

	return (
		<Stack justifyContent="center" height="100%" alignItems="center">
			<Stack sx={{ maxWidth: 500, width: '100%' }}>
				<Paper elevation={2}>
					<Stack
						spacing={2}
						justifyContent="center"
						padding={4}
						component="form"
						onSubmit={(e) => {
							e.preventDefault()
							registerForm.handleSubmit()
						}}
					>
						<Stack alignItems="center">
							<TenebrieLogo />
						</Stack>
						<Divider />
						<Typography variant="h6" align="center" sx={{ padding: 1 }}>
							Create new account
						</Typography>
						<AlreadyLoggedInAlert parentSpacing={2} />
						<ApiErrorBanner apiState={createAccountState} />
						<registerForm.AppField name="email">
							{() => (
								<BoundTextField
									id="email"
									autoComplete="username"
									label="Email"
									type="text"
									autoFocus
									fullWidth
									onChangeCallback={() => {
										if (createAccountState.isError) {
											createAccountState.reset()
										}
									}}
								/>
							)}
						</registerForm.AppField>
						<registerForm.AppField name="username">
							{() => (
								<BoundTextField
									id="username"
									autoComplete="display-name"
									label="Username"
									type="text"
									fullWidth
									onChangeCallback={() => {
										if (createAccountState.isError) {
											createAccountState.reset()
										}
									}}
								/>
							)}
						</registerForm.AppField>
						<registerForm.AppField name="password">
							{() => (
								<BoundTextField
									id="password"
									autoComplete="new-password"
									label="Password"
									type="password"
									helperText="Must be at least 12 characters"
									fullWidth
									onChangeCallback={() => {
										if (createAccountState.isError) {
											createAccountState.reset()
										}
									}}
								/>
							)}
						</registerForm.AppField>
						<Stack spacing={2} alignItems="center">
							<Button
								loading={createAccountState.isLoading}
								variant="contained"
								type="submit"
								loadingPosition="center"
								startIcon={<AppRegistrationRounded />}
								fullWidth
							>
								<span>Register</span>
							</Button>
							<Typography variant="caption" color="text.secondary">
								By registering you agree to the{' '}
								<Link href={`${getLandingOrigin()}/privacy`} target="_blank" rel="noopener">
									Privacy Policy
								</Link>
							</Typography>
							<Stack spacing={1} alignItems="center">
								<Link
									component={NavLink}
									from="/"
									to="/login"
									variant="body2"
									sx={{ textDecoration: 'none' }}
								>
									Already have an account? Sign in instead
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

export default CreateAccount
