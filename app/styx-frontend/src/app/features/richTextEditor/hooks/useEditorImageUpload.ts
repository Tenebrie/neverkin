import { Fragment, Slice } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'
import { useCallback } from 'react'
import { v4 as getRandomId } from 'uuid'

import { useFileUpload } from '@/api/hooks/fileUpload/useFileUpload'

export type PendingImageUpload = {
	uploadId: string
	file: Promise<File>
}

export function useEditorImageUpload() {
	const { uploadFile } = useFileUpload()

	const uploadImages = useCallback(
		(view: EditorView, uploads: PendingImageUpload[]) => {
			uploads.forEach(async ({ file, uploadId }) => {
				const fileHandle = await file
				const response = await uploadFile(fileHandle, 'ImageEmbed')

				let foundPos = -1
				view.state.doc.descendants((node, pos) => {
					if (node.type.name === 'externalImageNode' && node.attrs.uploadId === uploadId) {
						foundPos = pos
						return false
					}
				})
				if (foundPos < 0) {
					return
				}

				const currentNode = view.state.doc.nodeAt(foundPos)
				if (!currentNode) {
					return
				}

				view.dispatch(
					view.state.tr.setNodeMarkup(foundPos, undefined, {
						...currentNode.attrs,
						assetId: response.id,
						uploadId: null,
						externalImageProps: {
							...currentNode.attrs.externalImageProps,
							sizeX: response.imageWidth,
							sizeY: response.imageHeight,
						},
					}),
				)
			})
		},
		[uploadFile],
	)

	const insertImageFiles = useCallback(
		(view: EditorView, files: File[]) => {
			const uploads = files.map((file) => ({ uploadId: getRandomId(), file: Promise.resolve(file) }))
			const nodes = uploads.map(({ uploadId }) =>
				view.state.schema.nodes['externalImageNode'].create({ src: null, uploadId }),
			)
			view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.fromArray(nodes), 0, 0)))
			uploadImages(view, uploads)
		},
		[uploadImages],
	)

	return { insertImageFiles, uploadImages }
}
