import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { TokenService } from '@src/services/TokenService.js'
import { UserActivityService } from '@src/services/UserActivityService.js'
import { ParameterizedContext } from 'koa'
import { useHeaderParams } from 'moonflower'
import { UnauthorizedError } from 'moonflower/errors/UserFacingErrors'
import { useCookieParams } from 'moonflower/hooks/useCookieParams'
import { NonEmptyStringValidator } from 'moonflower/validators/BuiltInValidators'
import { OptionalParam, RequiredParam } from 'moonflower/validators/ParamWrappers'

import { AUTH_COOKIE_NAME, SERVICE_AUTH_TOKEN_HEADER } from '../../ts-shared/const/constants.js'
import { ImpersonatedUserAuthenticator } from './ImpersonatedUserAuthenticator.js'
export { AUTH_COOKIE_NAME }

export const UserAuthenticator = async (ctx: ParameterizedContext) => {
	const user = await resolveUser(ctx)
	UserActivityService.recordActivity(ctx, user.id)
	return user
}

async function resolveUser(ctx: ParameterizedContext) {
	// If another service is impersonating a user
	const { serviceAuthToken } = useHeaderParams(ctx, {
		[SERVICE_AUTH_TOKEN_HEADER]: OptionalParam(NonEmptyStringValidator),
	})
	if (serviceAuthToken) {
		return ImpersonatedUserAuthenticator(ctx)
	}

	const { [AUTH_COOKIE_NAME]: token } = useCookieParams(ctx, {
		[AUTH_COOKIE_NAME]: RequiredParam(NonEmptyStringValidator),
	})

	try {
		const tokenPayload = TokenService.decodeUserToken(token)

		const user = await getPrismaClient().user.findFirst({
			where: {
				id: tokenPayload.id,
				deletedAt: null,
			},
		})
		if (!user) {
			throw new UnauthorizedError('Invalid auth token')
		}
		return user
	} catch {
		throw new UnauthorizedError('Invalid auth token')
	}
}
