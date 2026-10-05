import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { Router, ServiceUnavailableError, useApiEndpoint } from 'moonflower'

const router = new Router()

router.get('/health', async (ctx) => {
	useApiEndpoint({
		name: 'getHealth',
		description: 'Check the health of the server.',
	})

	if (!HealthStatus.initCompleted) {
		throw new ServiceUnavailableError('Rhea is still initializing')
	}

	try {
		await checkDatabaseConnection()
	} catch {
		throw new ServiceUnavailableError('Database connection failed')
	}

	ctx.set('Content-Type', 'text/plain; charset=utf-8')
	return 'OK'
})

router.get('/api/health', async (ctx) => {
	useApiEndpoint({
		name: 'getApiHealth',
		description: 'Check the health of the server (API endpoint).',
	})

	if (!HealthStatus.initCompleted) {
		throw new ServiceUnavailableError('Rhea is still initializing')
	}

	try {
		await checkDatabaseConnection()
	} catch {
		throw new ServiceUnavailableError('Database connection failed')
	}

	ctx.set('Content-Type', 'text/plain; charset=utf-8')
	return 'OK'
})

export const HealthRouter = router

export const HealthStatus = {
	initCompleted: false,
	markRheaAsReady: () => {
		HealthStatus.initCompleted = true
	},
}

function checkDatabaseConnection() {
	// eslint-disable-next-line no-restricted-properties
	return getPrismaClient().$queryRaw`SELECT 1;`
}
