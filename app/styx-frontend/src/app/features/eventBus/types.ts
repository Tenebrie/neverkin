import type { NavigateOptions } from '@tanstack/react-router'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { MarkerType, TimelineEntity } from '@/api/types/worldTypes'
import { BoxedMindmapParent } from '@/app/views/world/views/mindmap/hooks/useBoxedMindmapContent'
import { Position } from '@/app/views/world/views/timeline/utils/Position'
import { ClientToCalliopeMessage } from '@/ts-shared/ClientToCalliopeMessage'

type ScrollTimelineToParams =
	| {
			timestamp: number
			skipAnim?: boolean
	  }
	| {
			rawScrollValue: number
			skipAnim?: boolean
	  }

export type EventParams = {
	'timeline/onScroll': number
	'timeline/onResize': { width: number; height: number }
	'timeline/onMarkerHovered': { marker: TimelineEntity<MarkerType>; hover: boolean }
	'timeline/pips/forceUpdate': number
	'timeline/requestScrollTo': ScrollTimelineToParams
	'timeline/requestScrollLeft': void
	'timeline/requestScrollRight': void
	'timeline/requestZoom': { direction: 'in' | 'out' }
	'timeline/eventDrawer/onResize': { height: number }
	'timeline/eventEditor/requestOpen': { extraHeight?: number }
	'timeline/tracksDrawer/onResize': { height: number }
	'timeline/anchor/updateSlot': {
		slotId: number
		data: {
			timestamp: number
			size: 'large' | 'medium' | 'small' | 'smallest'
			formatString: string
			followerCount: number
			followerSpacing: number
		} | null
	}
	'mindmap/actorEditor/requestOpen': { extraHeight?: number }
	'mindmap/node/onMove': {
		nodeId: string
		positionX: number
		positionY: number
	}
	'mindmap/node/onGroupDragStart': {
		sourceNodeId: string
	}
	'mindmap/node/onGroupDragUpdate': {
		sourceNodeId: string
		deltaX: number
		deltaY: number
	}
	'mindmap/node/onGroupDragEnd': {
		sourceNodeId: string
	}
	'mindmap/node/requestOpenContextMenu': {
		position: Position
		node: MindmapNode
		parent: BoxedMindmapParent
	}
	'mindmap/bulk/requestOpenContextMenu': {
		position: Position
	}
	'mindmap/wire/requestNodeTarget': {
		sourceNodeIds: string[]
	}
	'mindmap/selection/changed': {
		selectedNodeIds: Set<string>
		selectedWireIds: Set<string>
	}
	'mindmap/hover/changed': {
		hoveredNodeIds: Set<string>
		hoveredWireIds: Set<string>
	}
	'world/requestNavigation': NavigateOptions
	'calliope/onReconnected': { isReconnect: boolean }
	'calliope/requestSendMessage': ClientToCalliopeMessage
	'calliope/documentReset': { worldId: string; entityId: string }
	'calliope/announcementReceived': void
	'announcements/requestOpen': void
	'quickSelect/onKeyDown': {
		key: string
		shiftKey: boolean
	}
	'quickSelect/requestOpen': {
		query: string
		screenPosTop: number
		screenPosBottom: number
		screenPosLeft: number
	}
	'quickSelect/requestUpdate': {
		query: string
		screenPosTop: number
		screenPosBottom: number
		screenPosLeft: number
	}
	'quickSelect/requestUpdateQuery': {
		query: string
	}
	'quickSelect/requestClose': void
	'quickSelect/onClosed': void
	'richEditor/mentionRender/onStart': { node: ProseMirrorNode }
	'richEditor/mentionRender/onEnd': { node: ProseMirrorNode }
	'richEditor/requestFocus': void
	'richEditor/requestBlur': void
	'summonable/requestSummon': {
		family: string
		element: HTMLElement
		event: { isHandled: boolean }
		props: unknown
	}
	'summonable/requestUpdate': {
		family: string
		element: HTMLElement
		props: unknown
	}
	'summonable/requestDismiss': {
		family: string
		element: HTMLElement
	}
}

// export type EventParams = { [K in keyof typeof eventDefs]: (typeof eventDefs)[K] }
export type AllowedEvents = keyof EventParams
