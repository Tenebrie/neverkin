import Add from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'

import { useModal } from '@/app/features/modals/ModalsSlice'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { isEntityNameValid } from '@/app/utils/isEntityNameValid'
import { useCreateActor } from '@/app/views/world/api/useCreateActor'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

export const CreateActorModal = () => {
	const { isOpen } = useModal('createActorModal')

	const [name, setName] = useState('')
	const [nameValidationError, setNameValidationError] = useState<string | null>(null)

	const [createActor, { isLoading }] = useCreateActor()
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	useEffect(() => {
		setNameValidationError(null)
	}, [name])

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setName('')
			setNameValidationError(null)
		},
	})

	const onConfirm = async () => {
		if (!isOpen) {
			return
		}

		const validationResult = isEntityNameValid(name)
		if (validationResult.error) {
			setNameValidationError(validationResult.error)
			return
		}

		const createdActor = await createActor({
			name,
		})

		if (!createdActor) {
			setNameValidationError('Failed to create actor')
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

	const { largeLabel: shortcutLabel } = useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], onConfirm, isOpen)

	return (
		<Modal visible={isOpen} onClose={onCloseAttempt}>
			<ModalHeader>Create new actor</ModalHeader>
			<TextField
				label="Name"
				type="text"
				value={name}
				onChange={(event) => setName(event.target.value)}
				error={!!nameValidationError}
				helperText={nameValidationError}
				autoFocus
			/>
			<ModalFooter>
				<Tooltip title={shortcutLabel} arrow placement="top">
					<Button
						loading={isLoading}
						variant="contained"
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
		</Modal>
	)
}
