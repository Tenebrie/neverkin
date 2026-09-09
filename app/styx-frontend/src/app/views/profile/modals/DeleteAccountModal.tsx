import Delete from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

import { useDeleteAccountMutation } from '@/api/authApi'
import { useClearSession } from '@/app/features/auth/hooks/useClearSession'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

export const DeleteAccountModal = () => {
	const navigate = useStableNavigate()
	const [deleteAccount, { isLoading }] = useDeleteAccountMutation()
	const [deletionError, setDeletionError] = useState<string | null>(null)
	const [confirmText, setConfirmText] = useState('')

	const { isOpen, close } = useModal('deleteAccountModal')

	const clearSession = useClearSession()

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setDeletionError(null)
			setConfirmText('')
		},
	})

	const onConfirm = async () => {
		if (confirmText.toLowerCase() !== 'delete') {
			return
		}

		const result = await deleteAccount()
		if ('error' in result) {
			setDeletionError('Unable to delete account. Please try again.')
			return
		}

		close()
		clearSession()
		navigate({ from: '/', to: '/login' })
	}

	const onCloseAttempt = () => {
		if (!isLoading) {
			close()
		}
	}

	const canConfirm = confirmText.toLowerCase() === 'delete'
	const { largeLabel: shortcutLabel } = useShortcut(
		[Shortcut.Enter, Shortcut.CtrlEnter],
		() => {
			if (canConfirm) {
				onConfirm()
			}
		},
		isOpen && canConfirm,
	)

	return (
		<Modal visible={isOpen} onClose={onCloseAttempt}>
			<ModalHeader>Delete account permanently?</ModalHeader>
			<Stack spacing={2}>
				<div>
					This action <strong>cannot be undone</strong>. This will permanently delete your account and remove
					all of your data from our servers, including:
				</div>
				<Box component="ul" sx={{ pl: 2, m: 0 }}>
					<li>All worlds you have created</li>
					<li>All events, actors, and wiki articles</li>
					<li>All uploaded assets and images</li>
					<li>Your user profile and settings</li>
				</Box>
				<div>
					To confirm deletion, please type <strong>DELETE</strong> below:
				</div>
				<TextField
					data-testid="DeleteAccountConfirmationInput"
					autoFocus
					fullWidth
					value={confirmText}
					onChange={(e) => setConfirmText(e.target.value)}
					placeholder="Type DELETE to confirm"
					error={(confirmText.length > 0 && confirmText !== 'DELETE') || !!deletionError}
					helperText={deletionError}
				/>
			</Stack>
			<ModalFooter>
				<Tooltip
					title={canConfirm ? shortcutLabel : 'Please fill the confirmation text'}
					arrow
					placement="top"
				>
					<Button
						loading={isLoading}
						variant="contained"
						color="error"
						onClick={onConfirm}
						disabled={!canConfirm}
						loadingPosition="start"
						startIcon={<Delete />}
					>
						<span>Delete my account</span>
					</Button>
				</Tooltip>
				<Button variant="outlined" onClick={onCloseAttempt}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	)
}
