import { Slice } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'
import { useCallback } from 'react'
import { v4 as getRandomId } from 'uuid'

import { base64ToFile } from '@/api/hooks/fileUpload/base64ToFile'

import { mapProseMirrorSlice } from '../utils/mapProseMirrorSlice'
import { PendingImageUpload, useEditorImageUpload } from './useEditorImageUpload'

export function useEditorPasteHandler() {
	const { insertImageFiles, uploadImages } = useEditorImageUpload()

	function getReadableTimestamp() {
		return new Date().toISOString().slice(0, 19).replace('T', ' ')
	}

	const handlePaste = useCallback(
		(view: EditorView, event: ClipboardEvent, slice: Slice) => {
			// Pasted files, likely from the OS (screenshots)
			if (slice.size === 0 && event.clipboardData?.files?.length) {
				insertImageFiles(view, [...event.clipboardData.files])
				return true
			}

			const uploadingFiles: PendingImageUpload[] = []

			// Pre-parsed slice, likely HTML content from elsewhere
			const cleanedSlice = mapProseMirrorSlice(slice, (node) => {
				if (node.type.name === 'externalImageNode' && node.attrs.src?.startsWith('data:')) {
					const uploadId = getRandomId()
					uploadingFiles.push({
						uploadId,
						file: base64ToFile(node.attrs.src, `Embedded Image ${getReadableTimestamp()}`),
					})
					return node.type.create({ ...node.attrs, src: null, uploadId }, node.content, node.marks)
				}
				return null
			})

			view.dispatch(view.state.tr.replaceSelection(cleanedSlice))
			uploadImages(view, uploadingFiles)
			return true
		},
		[insertImageFiles, uploadImages],
	)

	return { handlePaste }
}
