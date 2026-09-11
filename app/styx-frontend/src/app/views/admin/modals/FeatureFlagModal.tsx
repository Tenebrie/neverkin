import DeleteIcon from '@mui/icons-material/Delete'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import { useAdminGetFeatureFlagsQuery, useAdminSetFeatureFlagMutation } from '@/api/adminUsersApi'
import { ListFeatureFlagsApiResponse, useListFeatureFlagsQuery } from '@/api/otherApi'
import { useModal } from '@/app/features/modals/ModalsSlice'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

type FeatureFlag = ListFeatureFlagsApiResponse['featureFlags'][number]

export const FeatureFlagModal = () => {
	const { isOpen, targetUser, close } = useModal('featureFlagModal')
	const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)

	const { data: allFlags } = useListFeatureFlagsQuery(undefined, { skip: !isOpen })
	const { data: userFlags } = useAdminGetFeatureFlagsQuery(
		{ userId: targetUser?.id ?? '' },
		{ skip: !isOpen || !targetUser },
	)
	const [setFeatureFlag] = useAdminSetFeatureFlagMutation()

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			setSelectedFlag(null)
		},
	})

	const availableFlags = (allFlags?.featureFlags ?? []).filter((flag) => !userFlags?.includes(flag))

	const handleAdd = async () => {
		if (!selectedFlag || !targetUser) {
			return
		}
		await setFeatureFlag({ body: { flag: selectedFlag, userId: targetUser.id, enable: true } })
		setSelectedFlag(null)
	}

	const handleRemove = async (flag: FeatureFlag) => {
		if (!targetUser) {
			return
		}
		await setFeatureFlag({ body: { flag, userId: targetUser.id, enable: false } })
	}

	if (!targetUser) {
		return null
	}

	return (
		<Modal visible={isOpen} onClose={close}>
			<ModalHeader>Feature Flags — {targetUser.username}</ModalHeader>
			<Stack spacing={2} sx={{ minWidth: 400 }}>
				<Stack direction="row" gap={1}>
					<Autocomplete
						size="small"
						options={availableFlags}
						value={selectedFlag}
						onChange={(_, value) => setSelectedFlag(value)}
						renderInput={(params) => <TextField {...params} label="Add feature flag" />}
						sx={{ flex: 1 }}
					/>
					<Button variant="contained" disabled={!selectedFlag} onClick={handleAdd}>
						Add
					</Button>
				</Stack>
				{userFlags && userFlags.length > 0 ? (
					<List sx={{ maxHeight: 300, overflow: 'auto' }} dense>
						{userFlags.map((flag) => (
							<ListItem
								key={flag}
								secondaryAction={
									<IconButton edge="end" size="small" onClick={() => handleRemove(flag as FeatureFlag)}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								}
							>
								<ListItemText>
									<Chip label={flag} size="small" />
								</ListItemText>
							</ListItem>
						))}
					</List>
				) : (
					<Typography variant="body2" color="text.secondary">
						No feature flags enabled for this user.
					</Typography>
				)}
			</Stack>
			<ModalFooter>
				<Button onClick={close}>Close</Button>
			</ModalFooter>
		</Modal>
	)
}
