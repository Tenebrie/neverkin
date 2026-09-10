import { CalendarUnitFormatMode, WorldAccessMode } from '@prisma/client'
import { PremiumAuthenticator } from '@src/middleware/auth/PremiumAuthenticator.js'
import { CalendarTemplateService } from '@src/services/CalendarTemplateService.js'
import { AllFeatureFlags } from '@src/services/FeatureFlagService.js'
import { ImageGenerationService } from '@src/services/ImageGenerationService.js'
import { keysOf } from '@src/utils/keysOf.js'
import { Router, useApiEndpoint, useAuth } from 'moonflower'

const router = new Router()

router.get('/api/constants/admin-levels', async () => {
	useApiEndpoint({
		name: 'adminGetUserLevels',
		description: 'Get all available user levels',
		tags: [],
	})

	return ['Free', 'Premium', 'Admin'] as const
})

router.get('/api/constants/world-access-modes', async () => {
	useApiEndpoint({
		name: 'listWorldAccessModes',
		description: 'Lists all available world access modes.',
	})

	return keysOf(WorldAccessMode)
})

router.get('/api/constants/calendar-templates', async () => {
	useApiEndpoint({
		name: 'listCalendarTemplates',
		description: 'Lists all built-in calendar templates',
	})

	const templates = CalendarTemplateService.getSupportedTemplates()

	return {
		keys: keysOf(templates),
		templates: Object.entries(templates).map(([id, template]) => ({
			id,
			...template,
		})),
	}
})

router.get('/api/constants/calendar-unit-format-modes', async () => {
	useApiEndpoint({
		name: 'listCalendarUnitFormatModes',
		description: 'Lists all available calendar unit format modes.',
	})

	return keysOf(CalendarUnitFormatMode)
})

router.get('/api/constants/image-generation-models', async (ctx) => {
	useApiEndpoint({
		name: 'listImageGenerationModels',
		description: 'Returns a list of available AI image generation models.',
	})

	await useAuth(ctx, PremiumAuthenticator)

	return {
		models: await ImageGenerationService.listModels(),
	}
})

router.get('/api/constants/feature-flags', async () => {
	useApiEndpoint({
		name: 'listFeatureFlags',
		description: 'Returns a list of available feature flags.',
	})

	return {
		featureFlags: AllFeatureFlags,
	}
})

export const ConstantsRouter = router
