import { WikiEntityType } from '@/api/types/worldTypes'

export const DefaultColors: Record<WikiEntityType | 'node', string> = {
	actor: '#32a995',
	article: '#3a92e4',
	folder: '#9f7eed',
	event: '#efb45e',
	tag: '#9f2261',
	node: '#6b7a99',
}
