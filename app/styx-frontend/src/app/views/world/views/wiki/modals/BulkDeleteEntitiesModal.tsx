import Delete from '@mui/icons-material/Delete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useMemo, useState } from 'react'

import { useModal } from '@/app/features/modals/ModalsSlice'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useBulkDelete } from '@/app/views/world/api/useBulkDelete'
import { useEntityResolver } from '@/app/views/world/modals/editEventModal/hooks/useEntityResolver'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

export function BulkDeleteEntitiesModal() {
	const [deleteArticles, { isLoading }] = useBulkDelete()
	const [deletionError, setDeletionError] = useState<string | null>(null)

	const { isOpen, close, articles } = useModal('bulkDeleteEntitiesModal')

	const { resolveEntity } = useEntityResolver()
	const entityToDelete = useMemo(() => {
		if (articles.length !== 1) {
			return
		}
		return resolveEntity(articles[0])
	}, [articles, resolveEntity])

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setDeletionError(null)
		},
	})

	const onConfirm = async () => {
		const { error } = await deleteArticles(articles)
		if (error) {
			setDeletionError(error.message)
			return
		}

		close()
	}

	const onCloseAttempt = () => {
		if (!isLoading) {
			close()
		}
	}

	const { largeLabel: shortcutLabel } = useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], onConfirm, isOpen)

	return (
		<Modal visible={isOpen} onClose={onCloseAttempt}>
			{entityToDelete && <ModalHeader>Delete {entityToDelete?.type}</ModalHeader>}
			{articles.length > 1 && <ModalHeader>Bulk delete</ModalHeader>}
			<Stack spacing={2}>
				{articles.length === 1 && (
					<div>
						Attempting to permanently delete {entityToDelete?.type} &apos;
						<b>{entityToDelete?.entity.name}</b>&apos;. This will also delete all related data.
					</div>
				)}
				{articles.length > 1 && (
					<div>
						Attempting to permanently delete <b>{articles.length}</b> entitites. This will also delete all
						related data.
					</div>
				)}
				<div>This action can&apos;t be reverted!</div>
				{deletionError && (
					<div style={{ color: 'red' }}>
						Unable to delete: <b>{deletionError}</b>
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
						startIcon={<Delete />}
					>
						<span>Confirm</span>
					</Button>
				</Tooltip>
				<Button variant="outlined" onClick={onCloseAttempt}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	)
}
