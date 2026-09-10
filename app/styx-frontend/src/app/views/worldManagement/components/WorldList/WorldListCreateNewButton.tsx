import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'

import { useCreateWorldMutation } from '@/api/worldListApi'
import {
	CalendarSelector,
	useTemplateCalendars,
} from '@/app/features/time/calendar/components/CalendarSelector'
import { isEntityNameValid } from '@/app/utils/isEntityNameValid'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { CreatePopoverButton } from '@/ui-lib/components/PopoverButton/CreatePopoverButton'
import { CreatePopoverIconButton } from '@/ui-lib/components/PopoverButton/CreatePopoverIconButton'

type Props = {
	variant?: 'icon' | 'labelled'
	label?: string
}

export function WorldListCreateNewButton({ variant = 'icon', label = 'New world' }: Props) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [calendars, setCalendars] = useState<string[]>([])
	const calendarTemplates = useTemplateCalendars()
	useEffect(() => {
		setCalendars(calendarTemplates.length > 0 ? [calendarTemplates[0].id] : [])
	}, [calendarTemplates])

	const [error, setError] = useState<string | null>(null)

	const [createWorld, { isLoading: isCreating }] = useCreateWorldMutation()

	useEffect(() => {
		setError(null)
	}, [name])

	const handleCreateWorld = useCallback(async () => {
		if (!name.trim()) {
			return false
		}

		const validationResult = isEntityNameValid(name)
		if (validationResult.error) {
			setError(validationResult.error)
			return false
		}

		const { error } = parseApiResponse(
			await createWorld({
				body: { name: name.trim(), description: description.trim(), calendars },
			}),
		)
		if (error) {
			setError(error.message)
			return false
		}

		setName('')
		setDescription('')
		setCalendars(calendarTemplates.length > 0 ? [calendarTemplates[0].id] : [])
	}, [name, description, createWorld, calendars, calendarTemplates])

	const sharedProps = {
		tooltip: 'Create new world',
		onConfirm: handleCreateWorld,
		confirmDisabled: !name.trim() || isCreating,
		popoverSx: {
			minWidth: 300,
		},
		popoverBody: ({ close }: { close: () => void }) => (
			<>
				<Typography variant="subtitle1" fontWeight="bold">
					New World
				</Typography>
				<TextField
					label="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={async (e) => {
						if (e.key !== 'Enter') {
							return
						}
						const returnValue = await handleCreateWorld()
						if (returnValue !== false) {
							close()
						}
					}}
					autoFocus
					fullWidth
					disabled={isCreating}
					error={!!error}
					helperText={error}
				/>
				<TextField
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					onKeyDown={async (e) => {
						if (e.key !== 'Enter') {
							return
						}
						const returnValue = await handleCreateWorld()
						if (returnValue !== false) {
							close()
						}
					}}
					fullWidth
					disabled={isCreating}
				/>
				<CalendarSelector value={calendars[0]} onChange={(value) => setCalendars([value])} />
			</>
		),
	}

	if (variant === 'icon') {
		return <CreatePopoverIconButton {...sharedProps} />
	}

	return <CreatePopoverButton {...sharedProps} tooltip={label} label={label} disableTooltip />
}
