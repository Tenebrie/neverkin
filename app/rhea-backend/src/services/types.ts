import { ActorService } from './ActorService.js'
import { TagService } from './TagService.js'
import { WikiArticleService } from './WikiArticleService.js'
import { WorldEventService } from './WorldEventService.js'

export type WorldEntityType = 'actor' | 'article' | 'event' | 'folder' | 'node' | 'tag'

export type BaselineActor = Awaited<ReturnType<typeof ActorService.findActorOrThrow>>
export type BaselineArticle = Awaited<ReturnType<typeof WikiArticleService.findArticleByIdOrThrow>>
export type BaselineWorldEvent = Awaited<ReturnType<typeof WorldEventService.fetchWorldEventWithDetails>>
export type BaselineTag = Awaited<ReturnType<typeof TagService.findTagOrThrow>>
