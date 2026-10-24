import { createTiptapExtensionSchema } from '@neverkin/tiptap-schema'
import type { Extensions } from '@tiptap/core'
import { getSchema } from '@tiptap/core'
import { generateHTML, generateJSON } from '@tiptap/html'
import { prosemirrorJSONToYXmlFragment, yXmlFragmentToProseMirrorFragment } from '@tiptap/y-tiptap'
import type * as Y from 'yjs'

const extensions = createTiptapExtensionSchema<Extensions>()
const schema = getSchema(extensions)

export function htmlToYDoc(html: string, doc: Y.Doc): void {
	const json = generateJSON(html, extensions)
	prosemirrorJSONToYXmlFragment(schema, json, doc.getXmlFragment('default'))
}

export function yDocToHtml(doc: Y.Doc): string {
	const content = yXmlFragmentToProseMirrorFragment(doc.getXmlFragment('default'), schema)
	return generateHTML(schema.topNodeType.create(null, content).toJSON(), extensions)
}
