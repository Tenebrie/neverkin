import ImageIcon from '@mui/icons-material/Image'
import UploadIcon from '@mui/icons-material/Upload'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Editor } from '@tiptap/react'
import { useState } from 'react'

import { Header } from '@/ui-lib/components/Header/Header'

import { useEditorImageUpload } from '../../hooks/useEditorImageUpload'
import { ToolbarPopoverButton } from './ToolbarPopoverButton'

type Props = {
	editor: Editor
}

export function InsertImageButton({ editor }: Props) {
	const { insertImageFiles } = useEditorImageUpload()
	const [url, setUrl] = useState('')

	const onEmbed = () => {
		if (!url.trim()) {
			return
		}
		editor
			.chain()
			.focus()
			.insertContent({
				type: 'externalImageNode',
				attrs: { src: url.trim() },
			})
			.run()
	}

	return (
		<ToolbarPopoverButton
			content={<ImageIcon fontSize="small" />}
			tooltip="Insert image"
			onCleanup={() => setUrl('')}
			onEnterKey={({ close }) => {
				onEmbed()
				close()
			}}
			popoverBody={({ close }) => (
				<>
					<Header variant="h3">Embed an image</Header>
					<Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
						Upload from device
						<input
							type="file"
							accept="image/*"
							multiple
							hidden
							onChange={(e) => {
								insertImageFiles(editor.view, [...(e.target.files ?? [])])
								editor.commands.focus()
								close()
							}}
						/>
					</Button>
					<Divider>or</Divider>
					<TextField
						size="small"
						type="url"
						label="URL"
						placeholder="Enter image URL"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						fullWidth
					/>
					<Typography variant="caption">Saved as a link and does not consume your storage.</Typography>
				</>
			)}
			popoverAction={({ close }) => (
				<Button
					variant="contained"
					disabled={!url.trim()}
					onClick={() => {
						onEmbed()
						close()
					}}
					fullWidth
				>
					Embed from URL
				</Button>
			)}
			popoverSx={{ padding: 2, width: 320 }}
			popoverAlign={{ vertical: 'bottom', horizontal: 'left' }}
		/>
	)
}
