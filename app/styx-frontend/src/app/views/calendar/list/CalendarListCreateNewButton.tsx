import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'

import { useCreateCalendarMutation } from '@/api/calendarApi'
import {
	CalendarSelector,
	useTemplateCalendars,
} from '@/app/features/time/calendar/components/CalendarSelector'
import { CreatePopoverButton } from '@/ui-lib/components/PopoverButton/CreatePopoverButton'
import { CreatePopoverIconButton } from '@/ui-lib/components/PopoverButton/CreatePopoverIconButton'

type Props = {
	variant?: 'icon' | 'labelled'
}

export function CalendarListCreateNewButton({ variant = 'icon' }: Props) {
	const [newCalendarName, setNewCalendarName] = useState('')
	const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>()
	const calendarTemplates = useTemplateCalendars()
	useEffect(() => {
		setSelectedTemplate(calendarTemplates.length > 0 ? calendarTemplates[0].id : undefined)
	}, [calendarTemplates])

	const [createCalendar, { isLoading: isCreating }] = useCreateCalendarMutation()

	const handleCreateCalendar = useCallback(async () => {
		if (!newCalendarName.trim()) {
			return
		}

		const result = await createCalendar({
			body: { name: newCalendarName.trim(), templateId: selectedTemplate },
		})
		if ('data' in result && result.data) {
			setNewCalendarName('')
		}
	}, [newCalendarName, createCalendar, selectedTemplate])

	const sharedProps = {
		tooltip: 'Create new calendar',
		onConfirm: handleCreateCalendar,
		confirmDisabled: !newCalendarName.trim() || isCreating,
		popoverSx: {
			minWidth: 300,
		},
		popoverBody: ({ close }: { close: () => void }) => (
			<>
				<Typography variant="subtitle2" fontWeight="bold">
					New Calendar
				</Typography>
				<TextField
					label="Name"
					value={newCalendarName}
					onChange={(e) => setNewCalendarName(e.target.value)}
					onKeyDown={async (e) => {
						if (e.key !== 'Enter') {
							return
						}
						await handleCreateCalendar()
						close()
					}}
					autoFocus
					fullWidth
					disabled={isCreating}
				/>
				<CalendarSelector
					label="Template to copy"
					value={selectedTemplate}
					onChange={setSelectedTemplate}
					allowEmpty
				/>
			</>
		),
	}

	if (variant === 'icon') {
		return <CreatePopoverIconButton {...sharedProps} />
	}

	return (
		<CreatePopoverButton
			{...sharedProps}
			tooltip="New calendar"
			label="New calendar"
			size="small"
			buttonVariant="outlined"
			disableTooltip
		/>
	)
}
