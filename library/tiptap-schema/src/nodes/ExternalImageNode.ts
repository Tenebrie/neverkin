import { Node } from '@tiptap/core'
import { z } from 'zod'

const PropsSchema = z.object({
	sizeX: z.number().optional().nullable(),
	sizeY: z.number().optional().nullable(),
})

export const ExternalImageNode = Node.create({
	name: 'externalImageNode',
	inline: false,
	group: 'block',

	addAttributes() {
		return {
			assetId: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-asset-id'),
				renderHTML: (attributes) => {
					if (!attributes.assetId) return {}
					return { 'data-asset-id': attributes.assetId }
				},
			},
			uploadId: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-upload-id'),
				renderHTML: (attributes) => {
					if (!attributes.uploadId) return {}
					return { 'data-upload-id': attributes.uploadId }
				},
			},
			// Browser consumers should override src.renderHTML to resolve relative URLs
			// (e.g. new URL(src, window.location.origin).href)
			src: {
				default: null,
				renderHTML: (attributes) => {
					if (!attributes.src) return {}
					return { src: attributes.src }
				},
			},
			alt: { default: null },
			type: {
				default: 'embeddedImage',
				parseHTML: (element) => element.getAttribute('data-type') || 'embeddedImage',
				renderHTML: (attributes) => ({
					'data-type': attributes.type,
				}),
			},
			externalImageProps: {
				default: {},
				parseHTML: (element) => {
					return PropsSchema.parse(JSON.parse(element.getAttribute('data-external-image-props') || '{}'))
				},
				renderHTML: (attributes) => {
					const props = attributes.externalImageProps as z.infer<typeof PropsSchema>
					return { 'data-external-image-props': JSON.stringify(props) }
				},
			},
		}
	},

	parseHTML() {
		return [
			{ tag: 'img[src]', priority: 1000 },
			{ tag: 'img[data-asset-id]', priority: 1000 },
		]
	},

	renderHTML({ HTMLAttributes }) {
		return ['img', HTMLAttributes]
	},
})
