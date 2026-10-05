import { MentionNode as MentionNodeBase, MentionNodeName } from '@neverkin/tiptap-schema'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { assimilate } from '@/app/features/richTextEditor/utils/assimilate'
import { store } from '@/app/store'

import { MentionView } from './MentionView'

export { MentionNodeName }

const getActorName = (node: ProseMirrorNode) => {
	const actorId = node.attrs.componentProps.actor as string | undefined
	if (!actorId) return null
	return store.getState().world.actors.find((actor) => actor.id === actorId)?.name ?? 'Unknown actor'
}

const getEventName = (node: ProseMirrorNode) => {
	const eventId = node.attrs.componentProps.event as string | undefined
	if (!eventId) return null
	return store.getState().world.events.find((event) => event.id === eventId)?.name ?? 'Unknown event'
}

const getArticleName = (node: ProseMirrorNode) => {
	const articleId = node.attrs.componentProps.article as string | undefined
	if (!articleId) return null
	return store.getState().wiki.articles.find((article) => article.id === articleId)?.name ?? 'Unknown article'
}

const getTagName = (node: ProseMirrorNode) => {
	const tagId = node.attrs.componentProps.tag as string | undefined
	if (!tagId) return null
	return store.getState().world.tags.find((tag) => tag.id === tagId)?.name ?? 'Unknown tag'
}

const mentionSelectionKey = new PluginKey('mentionSelectionDecoration')

export const MentionNode = assimilate(MentionNodeBase).extend({
	renderText({ node }) {
		const name =
			getActorName(node) ?? getEventName(node) ?? getArticleName(node) ?? getTagName(node) ?? 'Unknown entity'
		return `[${name}]`
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleClickOn(view, pos, node, nodePos, event, direct) {
						if (!direct) return false
						if (node.type.name !== MentionNodeName) return false
						const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, nodePos))
						view.dispatch(tr)
						return true
					},
				},
			}),
			new Plugin({
				key: mentionSelectionKey,
				props: {
					decorations(state) {
						const sel = state.selection
						if (!(sel instanceof TextSelection)) return DecorationSet.empty
						if (sel.empty) return DecorationSet.empty

						const decos: Decoration[] = []
						state.doc.nodesBetween(sel.from, sel.to, (node, pos) => {
							if (node.type.name !== MentionNodeName) return
							if (pos >= sel.from && pos + node.nodeSize <= sel.to) {
								decos.push(
									Decoration.node(pos, pos + node.nodeSize, {
										class: 'mention-in-range',
									}),
								)
							}
						})
						return DecorationSet.create(state.doc, decos)
					},
				},
			}),
		]
	},

	addNodeView() {
		return ReactNodeViewRenderer(MentionView)
	},
})
