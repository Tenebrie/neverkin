import Add from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { useModal } from '@/app/features/modals/ModalsSlice'
import { RichTextEditorSummoner } from '@/app/features/richTextEditor/portals/RichTextEditorPortal'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useCreateEvent } from '@/app/views/world/api/useCreateEvent'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

export const CreateEventModal = () => {
	const { isOpen } = useModal('createEventModal')
	const [descriptionPlain, setDescriptionPlain] = useState('')
	const [descriptionRich, setDescriptionRich] = useState('')
	const [creationError, setCreationError] = useState<string | null>(null)
	const [createEvent, { isLoading }] = useCreateEvent()
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setDescriptionPlain('')
			setDescriptionRich('')
			setCreationError(null)
		},
	})

	const { selectedTime } = useSelector(getWorldState, (a, b) => a.selectedTime === b.selectedTime)

	const targetTrack = useSearch({
		from: '/world/$worldId/_world',
		select: (search) => search.track,
	})

	const onConfirm = async () => {
		if (!isOpen) {
			return
		}

		const trimmedDescription = descriptionRich.trim()
		if (!trimmedDescription || trimmedDescription === '') {
			setCreationError('Description cannot be empty')
			return
		}

		const createdEvent = await createEvent({
			name: descriptionPlain.trim(),
			contentRich: trimmedDescription,
			timestamp: String(selectedTime),
			worldEventTrackId: targetTrack,
		})

		if (!createdEvent) {
			setCreationError('Failed to create event')
			return
		}

		navigate({
			search: (prev) => ({
				...prev,
				new: undefined,
			}),
		})
	}

	const onCloseAttempt = () => {
		if (isLoading) {
			return
		}
		navigate({
			search: (prev) => ({
				...prev,
				new: undefined,
			}),
		})
	}

	const { largeLabel: shortcutLabel } = useShortcut(
		Shortcut.CtrlEnter,
		() => {
			onConfirm()
		},
		isOpen ? 1 : -1,
	)

	return (
		<Modal visible={isOpen} onClose={onCloseAttempt}>
			<Stack
				sx={{
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<ModalHeader>Create New Event</ModalHeader>
				<Stack
					sx={{
						flexGrow: 1,
						minHeight: 0,
						display: 'flex',
						flexDirection: 'column',
						gap: 1,
					}}
				>
					<RichTextEditorSummoner
						value={descriptionRich}
						autoFocus
						onChange={(value) => {
							setDescriptionPlain(value.plainText)
							setDescriptionRich(value.richText)
							setCreationError(null)
						}}
					/>
					<ModalFooter>
						<Tooltip title={shortcutLabel} arrow placement="top">
							<Button
								data-testid="CreateEventModalConfirmButton"
								loading={isLoading}
								variant="contained"
								color="primary"
								onClick={onConfirm}
								loadingPosition="start"
								startIcon={<Add />}
							>
								<span>Create</span>
							</Button>
						</Tooltip>
						<Button variant="outlined" onClick={onCloseAttempt} disabled={isLoading}>
							Cancel
						</Button>
					</ModalFooter>
				</Stack>
				{creationError && (
					<Stack sx={{ color: 'error.main', typography: 'body2', fontWeight: 600, px: 2, py: 1 }}>
						{creationError}
					</Stack>
				)}
			</Stack>
		</Modal>
	)
}
