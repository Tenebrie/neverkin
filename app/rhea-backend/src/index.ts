import chalk from 'chalk'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { HttpErrorHandler, initOpenApiEngine, useApiHeader } from 'moonflower'

import { ActorRouter } from './routers/ActorRouter.js'
import { AdminFeatureFlagRouter } from './routers/AdminFeatureFlagRouter.js'
import { AdminRouter } from './routers/AdminRouter.js'
import { AnnouncementRouter } from './routers/AnnouncementRouter.js'
import { AssetUploadRouter } from './routers/AssetRouter.js'
import { AuthRouter } from './routers/AuthRouter.js'
import { CalendarPresentationRouter } from './routers/CalendarPresentationRouter.js'
import { CalendarRouter } from './routers/CalendarRouter.js'
import { ConstantsRouter } from './routers/ConstantsRouter.js'
import { ContactFormRouter } from './routers/ContactFormRouter.js'
import { ContentRouter } from './routers/ContentRouter.js'
import { DataMigrationRouter } from './routers/DataMigrationRouter.js'
import { HealthRouter, HealthStatus } from './routers/HealthRouter.js'
import { IconsRouter } from './routers/IconsRouter.js'
import { ImageConversionRouter } from './routers/ImageConversionRouter.js'
import { ImageGenerationRouter } from './routers/ImageGenerationRouter.js'
import { ClientAuthRouter } from './routers/internal/ClientAuthRouter.js'
import { MindmapRouter } from './routers/MindmapRouter.js'
import { NotificationRouter } from './routers/NotificationRouter.js'
import { ProfileRouter } from './routers/ProfileRouter.js'
import { TagRouter } from './routers/TagRouter.js'
import { WorldBulkRouter } from './routers/WorldBulkActionRouter.js'
import { WorldColorRouter } from './routers/WorldColorRouter.js'
import { WorldEventRouter } from './routers/WorldEventRouter.js'
import { WorldEventTrackRouter } from './routers/WorldEventTrackRouter.js'
import { WorldPinRouter } from './routers/WorldPinRouter.js'
import { WorldRouter } from './routers/WorldRouter.js'
import { WorldSearchRouter } from './routers/WorldSearchRouter.js'
import { WorldShareRouter } from './routers/WorldShareRouter.js'
import { WorldShareVisitRouter } from './routers/WorldShareVisitRouter.js'
import { WorldThumbnailRouter } from './routers/WorldThumbnailRouter.js'
import { WorldWikiArticleRouter } from './routers/WorldWikiArticleRouter.js'
import { WorldWikiFolderRouter } from './routers/WorldWikiFolderRouter.js'
import { AuditLogService } from './services/AuditLogService.js'
import { CloudStorageService } from './services/CloudStorageService.js'
import { RedisService } from './services/RedisService.js'
import { UserService } from './services/UserService.js'
import { isRunningInTest } from './utils/isRunningInTest.js'

export const app = new Koa()

useApiHeader({
	title: 'Neverkin Rhea',
	description: 'This is a description field',
	termsOfService: 'https://example.com',
	contact: {
		name: 'Tenebrie',
		url: 'https://github.com/tenebrie',
		email: 'tianara@tenebrie.com',
	},
	license: {
		name: 'Unlicensed',
		url: 'https://example.com',
	},
	version: '1.0.0',
})

app.proxy = true

app
	.use(HttpErrorHandler)
	.use(
		bodyParser({
			enableTypes: ['text', 'json', 'form'],
			jsonLimit: '15mb',
		}),
	)
	// Public routers
	.use(ActorRouter.routes())
	.use(ActorRouter.allowedMethods())
	.use(AdminFeatureFlagRouter.routes())
	.use(AdminFeatureFlagRouter.allowedMethods())
	.use(AdminRouter.routes())
	.use(AdminRouter.allowedMethods())
	.use(AnnouncementRouter.routes())
	.use(AnnouncementRouter.allowedMethods())
	.use(AssetUploadRouter.routes())
	.use(AssetUploadRouter.allowedMethods())
	.use(AuthRouter.routes())
	.use(AuthRouter.allowedMethods())
	.use(CalendarRouter.routes())
	.use(CalendarRouter.allowedMethods())
	.use(CalendarPresentationRouter.routes())
	.use(CalendarPresentationRouter.allowedMethods())
	.use(ConstantsRouter.routes())
	.use(ConstantsRouter.allowedMethods())
	.use(ContactFormRouter.routes())
	.use(ContactFormRouter.allowedMethods())
	.use(ContentRouter.routes())
	.use(ContentRouter.allowedMethods())
	.use(DataMigrationRouter.routes())
	.use(DataMigrationRouter.allowedMethods())
	.use(HealthRouter.routes())
	.use(HealthRouter.allowedMethods())
	.use(IconsRouter.routes())
	.use(IconsRouter.allowedMethods())
	.use(ImageConversionRouter.routes())
	.use(ImageConversionRouter.allowedMethods())
	.use(ImageGenerationRouter.routes())
	.use(ImageGenerationRouter.allowedMethods())
	.use(MindmapRouter.routes())
	.use(MindmapRouter.allowedMethods())
	.use(NotificationRouter.routes())
	.use(NotificationRouter.allowedMethods())
	.use(ProfileRouter.routes())
	.use(ProfileRouter.allowedMethods())
	.use(TagRouter.routes())
	.use(TagRouter.allowedMethods())
	.use(WorldEventRouter.routes())
	.use(WorldEventRouter.allowedMethods())
	.use(WorldEventTrackRouter.routes())
	.use(WorldEventTrackRouter.allowedMethods())
	.use(WorldRouter.routes())
	.use(WorldRouter.allowedMethods())
	.use(WorldBulkRouter.routes())
	.use(WorldBulkRouter.allowedMethods())
	.use(WorldColorRouter.routes())
	.use(WorldColorRouter.allowedMethods())
	.use(WorldPinRouter.routes())
	.use(WorldPinRouter.allowedMethods())
	.use(WorldSearchRouter.routes())
	.use(WorldSearchRouter.allowedMethods())
	.use(WorldShareRouter.routes())
	.use(WorldShareRouter.allowedMethods())
	.use(WorldShareVisitRouter.routes())
	.use(WorldShareVisitRouter.allowedMethods())
	.use(WorldThumbnailRouter.routes())
	.use(WorldThumbnailRouter.allowedMethods())
	.use(WorldWikiArticleRouter.routes())
	.use(WorldWikiArticleRouter.allowedMethods())
	.use(WorldWikiFolderRouter.routes())
	.use(WorldWikiFolderRouter.allowedMethods())
	// Internal use routers
	.use(ClientAuthRouter.routes())
	.use(ClientAuthRouter.allowedMethods())

if (!isRunningInTest()) {
	app.use(
		initOpenApiEngine(
			process.env.NODE_ENV === 'production'
				? { specPath: './dist/apiSpec.json' }
				: {
						tsconfigPath: './tsconfig.json',
						logLevel: 'info',
						sourceFileDiscovery: {
							rootPath: './src/routers',
						},
					},
		),
	)

	RedisService.initRedisConnection()
	app.listen(3000)
	console.info(`${chalk.greenBright('[Rhea]')} Listening on port ${chalk.blueBright('3000')}`)
	HealthStatus.markRheaAsReady()

	setInterval(() => {
		UserService.cleanUpDeletedUsers()
		UserService.cleanUpTestUsers()
		CloudStorageService.cleanUpExpiredAssets()
		CloudStorageService.cleanUpOrphanedAssets()
		AuditLogService.cleanUpOldLogs()
	}, 60000)
}
