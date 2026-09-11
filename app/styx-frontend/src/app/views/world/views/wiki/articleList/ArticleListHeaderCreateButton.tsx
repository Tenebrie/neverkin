import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'

import { useQuickCreateActor } from '@/api/hooks/useQuickCreateActor'
import { useQuickCreateArticle } from '@/api/hooks/useQuickCreateArticle'
import { useQuickCreateEvent } from '@/api/hooks/useQuickCreateEvent'
import { useQuickCreateTag } from '@/api/hooks/useQuickCreateTag'
import {
	CreatePopoverButton,
	CreatePopoverButtonProps,
} from '@/ui-lib/components/PopoverButton/CreatePopoverButton'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { useCreateFolder } from '../../../api/useCreateFolder'
import { useArticleCollapseControls } from './hooks/useArticleCollapseControls'

type Props = Omit<CreatePopoverButtonProps, 'tooltip' | 'popoverBody' | 'onConfirm'> & {
	folderId: string | null
}

export function ArticleListHeaderCreateButton({ folderId, slotProps, ...props }: Props) {
	const [newEntityName, setNewEntityName] = useState('')

	const createActor = useQuickCreateActor()
	const createEvent = useQuickCreateEvent()
	const createArticle = useQuickCreateArticle()
	const [createFolder] = useCreateFolder()
	const createTag = useQuickCreateTag()

	const { forceOpen } = useArticleCollapseControls({ id: folderId })

	const types = ['article', 'actor', 'event', 'tag', 'folder'] as const
	type Type = (typeof types)[number]
	const [selectedType, setSelectedType] = useState<Type>('article')

	const handleCreate = useCallback(async () => {
		if (selectedType === 'folder') {
			await createFolder({ name: newEntityName, parentFolderId: folderId })
		} else if (selectedType === 'article') {
			await createArticle({ query: newEntityName, parentFolderId: folderId })
		} else if (selectedType === 'actor') {
			await createActor({ query: newEntityName, parentFolderId: folderId })
		} else if (selectedType === 'event') {
			await createEvent({ query: newEntityName, parentFolderId: folderId })
		} else if (selectedType === 'tag') {
			await createTag({ query: newEntityName, parentFolderId: folderId })
		}
		forceOpen()
	}, [
		createActor,
		createArticle,
		createEvent,
		createFolder,
		createTag,
		folderId,
		forceOpen,
		newEntityName,
		selectedType,
	])

	return (
		<CreatePopoverButton
			onEnterKey={async ({ close }) => {
				await handleCreate()
				close()
			}}
			buttonVariant={folderId ? 'icon' : 'contained'}
			{...props}
			slotProps={{
				...slotProps,
				primaryButton: { size: 'small', ...slotProps?.primaryButton },
				popover: {
					sx: { marginTop: '4px' },
					anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
					transformOrigin: { vertical: 'top', horizontal: 'center' },
					...slotProps?.popover,
				},
			}}
			tooltip={folderId ? 'Create in folder' : 'Create new object'}
			disableTooltip
			popoverBody={() => (
				<>
					<Typography variant="subtitle2" fontWeight="bold">
						{folderId ? 'Create in folder' : 'Create new object'}
					</Typography>
					<ButtonGroup>
						{types.map((type) => (
							<Button
								key={type}
								variant={selectedType === type ? 'contained' : 'outlined'}
								onClick={() => setSelectedType(type)}
								startIcon={<EntityIcon variant={type} />}
								color="secondary"
							>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</Button>
						))}
					</ButtonGroup>
					<TextField
						size="small"
						placeholder="Name"
						value={newEntityName}
						onChange={(e) => setNewEntityName(e.target.value)}
						fullWidth
					/>
				</>
			)}
			onConfirm={handleCreate}
			onCleanup={() => setNewEntityName('')}
		/>
	)
}
