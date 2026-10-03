import { MentionPropsType } from '@neverkin/tiptap-schema'
import { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper } from '@tiptap/react'
import { useSelector } from 'react-redux'

import { ActorMentionChip } from '@/app/features/richTextEditor/components/chips/ActorMentionChip'
import { ArticleMentionChip } from '@/app/features/richTextEditor/components/chips/ArticleMentionChip'
import { EventMentionChip } from '@/app/features/richTextEditor/components/chips/EventMentionChip'
import { TagMentionChip } from '@/app/features/richTextEditor/components/chips/TagMentionChip'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

const ZERO_WIDTH_SPACE = String.fromCharCode(8203)

export function MentionView({ node }: NodeViewProps) {
	const worldId = useSelector(getWorldIdState)
	const props = node.attrs.componentProps as MentionPropsType
	const fallbackName = node.attrs.name as string | undefined

	const actorId = typeof props.actor === 'string' ? props.actor : undefined
	const eventId = typeof props.event === 'string' ? props.event : undefined
	const articleId = typeof props.article === 'string' ? props.article : undefined
	const tagId = typeof props.tag === 'string' ? props.tag : undefined

	return (
		<NodeViewWrapper as="span" data-type="mention" style={{ display: 'inline-block' }}>
			{ZERO_WIDTH_SPACE}
			{actorId && <ActorMentionChip worldId={worldId} actorId={actorId} fallbackName={fallbackName} />}
			{eventId && <EventMentionChip worldId={worldId} eventId={eventId} fallbackName={fallbackName} />}
			{articleId && (
				<ArticleMentionChip worldId={worldId} articleId={articleId} fallbackName={fallbackName} />
			)}
			{tagId && <TagMentionChip worldId={worldId} tagId={tagId} fallbackName={fallbackName} />}
			{ZERO_WIDTH_SPACE}
		</NodeViewWrapper>
	)
}
