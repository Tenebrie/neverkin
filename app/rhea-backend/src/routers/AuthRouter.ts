import { AUTH_COOKIE_NAME, UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { UserAuthenticatorWithAvatar } from '@src/middleware/auth/UserAuthenticatorWithAvatar.js'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { AnnouncementService } from '@src/services/AnnouncementService.js'
import { AuditLogService } from '@src/services/AuditLogService.js'
import { CloudStorageService } from '@src/services/CloudStorageService.js'
import { FeatureFlagService } from '@src/services/FeatureFlagService.js'
import { GoogleService } from '@src/services/GoogleService.js'
import {
	BadRequestError,
	EmailValidator,
	NonEmptyStringValidator,
	RequiredParam,
	Router,
	StringValidator,
	UnauthorizedError,
	useApiEndpoint,
	useAuth,
	useCookieParams,
	useOptionalAuth,
	useRequestBody,
} from 'moonflower'

import { TokenService } from '../services/TokenService.js'
import { UserService } from '../services/UserService.js'
import { adminUsersTag, announcementListTag, authTag, worldDetailsTag, worldListTag } from './utils/tags.js'

const router = new Router().with(SessionMiddleware)

router.get('/api/auth/check', async (ctx) => {
	useApiEndpoint({
		name: 'checkAuthentication',
		description: 'Checks if the user has a valid login credentials',
		tags: [authTag],
	})

	const user = await useOptionalAuth(ctx, UserAuthenticatorWithAvatar)
	const sessionId: string = ctx.sessionId ?? crypto.randomUUID()

	if (!user) {
		return {
			authenticated: false,
			sessionId,
		}
	}

	UserService.touchUser(user.id)
	const avatarUrl = user.avatar ? await CloudStorageService.getPresignedUrl(user.avatar) : undefined
	const featureFlags = await FeatureFlagService.listUserFeatureFlags(user.id)

	AuditLogService.append(
		ctx,
		{
			action: 'UserAuth',
			userId: user.id,
		},
		{
			minimalGapSeconds: 3600, // Log once per hour
		},
	)

	return {
		authenticated: true,
		sessionId,
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			level: user.level,
			bio: user.bio,
			avatarUrl,
			featureFlags,
		},
	}
})

router.post('/api/auth', async (ctx) => {
	useApiEndpoint({
		name: 'createAccount',
		summary: 'Registration endpoint',
		description: 'Creates a new user account with provided credentials',
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag],
	})

	const body = useRequestBody(ctx, {
		email: EmailValidator,
		username: NonEmptyStringValidator,
		password: NonEmptyStringValidator,
	})

	const existingUser = await UserService.findByEmail(body.email)
	if (existingUser) {
		throw new BadRequestError('User already exists')
	}

	const user = await UserService.register(body.email, body.username, body.password)
	const token = TokenService.generateJwtToken(user)
	const sessionId: string = ctx.sessionId ?? crypto.randomUUID()

	ctx.cookies.set(AUTH_COOKIE_NAME, token, {
		path: '/',
		expires: new Date(Date.now() + 365 * 24 * 3600 * 1000),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})

	AnnouncementService.sendWelcomeNotification(user.id)

	AuditLogService.append(ctx, {
		action: 'UserCreateAccount',
		userId: user.id,
	})

	return {
		user: {
			...user,
			featureFlags: await FeatureFlagService.listUserFeatureFlags(user.id),
			avatarUrl: undefined as string | undefined,
		},
		sessionId,
	}
})

router.post('/api/auth/guest', async (ctx) => {
	useApiEndpoint({
		name: 'createGuestAccount',
		summary: 'Guest registration endpoint',
		description: 'Creates a new guest user account with temporary credentials',
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag],
	})

	const user = await UserService.registerGuest()
	const token = TokenService.generateJwtToken(user)
	const sessionId: string = ctx.sessionId ?? crypto.randomUUID()

	ctx.cookies.set(AUTH_COOKIE_NAME, token, {
		path: '/',
		expires: new Date(Date.now() + 72 * 3600 * 1000),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})

	AnnouncementService.sendWelcomeNotification(user.id)

	AuditLogService.append(ctx, {
		action: 'GuestCreateAccount',
		userId: user.id,
	})

	return {
		user: {
			...user,
			featureFlags: await FeatureFlagService.listUserFeatureFlags(user.id),
			avatarUrl: undefined as string | undefined,
		},
		sessionId,
	}
})

router.post('/api/auth/google', async (ctx) => {
	useApiEndpoint({
		name: 'loginWithGoogle',
		summary: 'Google login endpoint',
		description: 'Logs in a user using the Google JWT token',
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag],
	})

	const { googleToken } = useRequestBody(ctx, {
		googleToken: StringValidator,
	})

	const { email, name } = await GoogleService.validateJwt(googleToken)

	const existingUser = await UserService.findByEmail(email)
	const user = await (async () => {
		if (existingUser) {
			return existingUser
		} else {
			return await UserService.register(email, name, 'unset')
		}
	})()
	const token = TokenService.generateJwtToken(user)
	const sessionId: string = ctx.sessionId ?? crypto.randomUUID()

	ctx.cookies.set(AUTH_COOKIE_NAME, token, {
		path: '/',
		expires: new Date(Date.now() + 365 * 24 * 3600 * 1000),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})

	if (!existingUser) {
		AnnouncementService.sendWelcomeNotification(user.id)
	}

	AuditLogService.append(ctx, {
		action: 'UserLoginWithGoogle',
		userId: user.id,
	})

	return {
		user: {
			...user,
			featureFlags: existingUser ? await FeatureFlagService.listUserFeatureFlags(user.id) : [],
			avatarUrl: undefined as string | undefined,
		},
		sessionId,
	}
})

router.post('/api/auth/login', async (ctx) => {
	useApiEndpoint({
		name: 'postLogin',
		summary: 'Login endpoint',
		description: 'Exchanges user credentials for a JWT token',
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag, adminUsersTag],
	})

	const body = useRequestBody(ctx, {
		email: EmailValidator,
		password: NonEmptyStringValidator,
	})

	const user = await UserService.login(body.email, body.password)
	if (!user) {
		AuditLogService.append(ctx, {
			action: 'UserLoginFailed',
		})
		throw new UnauthorizedError('Email or password do not match')
	}

	const token = TokenService.generateJwtToken(user)
	const sessionId: string = ctx.sessionId ?? crypto.randomUUID()

	ctx.cookies.set(AUTH_COOKIE_NAME, token, {
		path: '/',
		expires: new Date(new Date().getTime() + 365 * 24 * 3600 * 1000),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})

	AuditLogService.append(ctx, {
		action: 'UserLoginWithPassword',
		userId: user.id,
	})

	const avatarUrl = user.avatar ? await CloudStorageService.getPresignedUrl(user.avatar) : undefined

	return {
		user: {
			...user,
			featureFlags: await FeatureFlagService.listUserFeatureFlags(user.id),
			avatarUrl,
		},
		sessionId,
	}
})

router.post('/api/auth/logout', async (ctx) => {
	useApiEndpoint({
		name: 'postLogout',
		summary: 'Logout endpoint',
		description: "Clears the current user's auth cookie",
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag],
	})

	await useAuth(ctx, UserAuthenticator)

	const { [AUTH_COOKIE_NAME]: token } = useCookieParams(ctx, {
		[AUTH_COOKIE_NAME]: RequiredParam(NonEmptyStringValidator),
	})

	const tokenPayload = TokenService.decodeUserToken(token)

	// Normal user logout - clear the auth cookie
	if (!tokenPayload.impersonatingAdminId) {
		ctx.cookies.set(AUTH_COOKIE_NAME, '', {
			path: '/',
			expires: new Date(),
			secure: ctx.headers['x-forwarded-proto'] === 'https',
			sameSite: 'lax',
		})

		return {
			redirectTo: 'login' as 'login' | 'admin',
		}
	}

	// Restore the impersonating admin session
	const admin = await UserService.findByIdInternal(tokenPayload.impersonatingAdminId)
	if (!admin) {
		throw new UnauthorizedError('Invalid impersonation token')
	}
	const newToken = TokenService.generateJwtToken({
		id: admin.id,
		email: admin.email,
	})
	ctx.cookies.set(AUTH_COOKIE_NAME, newToken, {
		path: '/',
		expires: new Date(new Date().getTime() + 365 * 24 * 3600 * 1000),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})
	return {
		redirectTo: 'admin' as 'login' | 'admin',
	}
})

router.delete('/api/auth', async (ctx) => {
	useApiEndpoint({
		name: 'deleteAccount',
		summary: 'Account deletion endpoint',
		description: 'Deletes the current user account',
		tags: [authTag, worldListTag, worldDetailsTag, announcementListTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)
	await UserService.deleteUser(user.id)

	AuditLogService.append(ctx, {
		action: 'UserDeleteAccount',
		userId: user.id,
	})

	ctx.cookies.set(AUTH_COOKIE_NAME, '', {
		path: '/',
		expires: new Date(),
		secure: ctx.headers['x-forwarded-proto'] === 'https',
		sameSite: 'lax',
	})
})

export const AuthRouter = router
