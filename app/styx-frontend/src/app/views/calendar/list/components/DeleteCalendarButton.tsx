import { usePopupState } from 'material-ui-popup-state/hooks'

import { useDeleteCalendarMutation } from '@/api/calendarApi'
import { ConfirmPopoverButton } from '@/ui-lib/components/PopoverButton/ConfirmPopoverButton'
import { PopoverButtonSlotProps } from '@/ui-lib/components/PopoverButton/PopoverButton'

type Props = {
	calendarId: string
	calendarName: string
	slotProps?: PopoverButtonSlotProps
}

export function DeleteCalendarButton({ calendarId, calendarName, slotProps }: Props) {
	const [deleteCalendar, { isLoading }] = useDeleteCalendarMutation()
	const popupState = usePopupState({ variant: 'popover', popupId: `delete-calendar-${calendarId}` })

	const handleDelete = async () => {
		await deleteCalendar({ calendarId })
		popupState.close()
	}

	return (
		<ConfirmPopoverButton
			type="delete"
			tooltip="Delete calendar"
			onConfirm={handleDelete}
			loading={isLoading}
			slotProps={slotProps}
			prompt={
				<>
					Are you sure you want to delete calendar <strong>{calendarName}</strong>?
				</>
			}
		/>
	)
}
