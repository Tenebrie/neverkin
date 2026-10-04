import { z } from 'zod'

export const SUPPORTED_WIKI_ENTITIES = ['actor', 'article', 'folder', 'event', 'tag'] as const

export const WikiEntityTypeSchema = z.enum(SUPPORTED_WIKI_ENTITIES)

export type WikiEntityType = z.infer<typeof WikiEntityTypeSchema>

export const SUPPORTED_MINDMAP_ENTITIES = ['actor', 'article', 'event', 'folder', 'node', 'tag'] as const
export const MindmapEntityTypeSchema = z.enum(SUPPORTED_MINDMAP_ENTITIES)
export type MindmapEntityType = z.infer<typeof MindmapEntityTypeSchema>
