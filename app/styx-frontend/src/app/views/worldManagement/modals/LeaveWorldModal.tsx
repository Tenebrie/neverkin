import Logout from '@mui/icons-material/Logout'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

import { useLeaveWorldCollaborationMutation } from '@/api/worldListApi'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

export const LeaveWorldModal = () => {
	const { isOpen, worldId, worldName, close } = useModal('leaveWorldModal')

	const [confirmLeaveWorld, { isLoading }] = useLeaveWorldCollaborationMutation()
	const [leaveError, setLeaveError] = useState<string | null>(null)

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setLeaveError(null)
		},
	})

	const onConfirm = async () => {
		if (!isOpen) {
			return
		}

		const { error } = parseApiResponse(
			await confirmLeaveWorld({
				worldId,
			}),
		)
		if (error) {
			setLeaveError(error.message)
			return
		}

		close()
	}

	const onClose = () => {
		if (isLoading) {
			return
		}
		close()
	}

	const { largeLabel: shortcutLabel } = useShortcut(
		[Shortcut.Enter, Shortcut.CtrlEnter],
		() => {
			onConfirm()
		},
		isOpen ? 1 : -1,
	)

	return (
		<Modal visible={isOpen} onClose={onClose} closeOnBackdropClick>
			<ModalHeader>Leave world</ModalHeader>
			<Stack spacing={2}>
				<div>
					Attempting to remove yourself from the collaborators on world <b>{worldName}</b>.
				</div>
				<div>It will be removed from your list, but you can rejoin again if you have a valid invite.</div>
				{leaveError && (
					<div style={{ color: 'red' }}>
						Unable to leave: <b>{leaveError}</b>
					</div>
				)}
			</Stack>
			<ModalFooter>
				<Tooltip title={shortcutLabel} arrow placement="top">
					<Button
						loading={isLoading}
						variant="contained"
						color="error"
						onClick={onConfirm}
						loadingPosition="start"
						startIcon={<Logout />}
					>
						<span>Confirm</span>
					</Button>
				</Tooltip>
				<Button variant="outlined" onClick={onClose}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	)
}
