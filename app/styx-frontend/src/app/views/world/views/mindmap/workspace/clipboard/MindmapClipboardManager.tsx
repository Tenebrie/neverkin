import { MindmapPasteDataSchema } from '@neverkin/zod-schema'
import { RefObject } from 'react'

import { useClipboard } from '@/app/features/clipboard/useClipboard'
import { pluralize } from '@/app/utils/pluralize'

import { useDeleteMindmapNodes } from '../../api/useDeleteMindmapNodes'
import { useDeleteMindmapWires } from '../../api/useDeleteMindmapWires'
import { useMindmapPasteData } from './useMindmapPasteData'

const STRUCTURED_DATA_TYPE = 'application/x-neverkin+json'

type Props = {
	containerRef: RefObject<HTMLDivElement | null>
}

export function MindmapClipboardManager({ containerRef }: Props) {
	const { createPasteData, applyPasteData, getCurrentSelection } = useMindmapPasteData()
	const [deleteNodes] = useDeleteMindmapNodes()
	const [deleteWires] = useDeleteMindmapWires()

	useClipboard({
		containerRef,
		onCopy: (event) => {
			if (!event.clipboardData) {
				console.error('Clipboard data is missing?')
				return
			}

			const structuredData = createPasteData()
			if (!structuredData) {
				return
			}

			event.clipboardData.setData(STRUCTURED_DATA_TYPE, JSON.stringify(structuredData))
			const totalNodes = structuredData.nodes.length
			const totalWires = structuredData.internalLinks.length + structuredData.externalLinks.length
			console.info(`Copied ${pluralize(totalNodes, 'node')} and ${pluralize(totalWires, 'wire')}`)
			event.preventDefault()
		},

		onCut: (event, copy) => {
			const { selectedNodes, selectedWires } = getCurrentSelection()
			if (selectedNodes.length === 0) {
				return
			}

			copy(event)

			deleteWires(selectedWires.map((wire) => wire.id))
			deleteNodes(selectedNodes.map((node) => node.id))
		},

		onPaste: (event) => {
			if (!event.clipboardData) {
				console.error('Clipboard data is missing?')
				return
			}
			if (!event.clipboardData.types.includes(STRUCTURED_DATA_TYPE)) {
				console.warn(`No ${STRUCTURED_DATA_TYPE} type found in clipboard`)
				return
			}

			const pasteData = MindmapPasteDataSchema.parse(
				JSON.parse(event.clipboardData.getData(STRUCTURED_DATA_TYPE)),
			)
			applyPasteData(pasteData)
		},
	})
	return null
}
