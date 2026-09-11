import ButtonBase from '@mui/material/ButtonBase'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { CalendarBrief } from '@/api/types/calendarTypes'
import { NavigationLink } from '@/app/components/NavigationLink'
import { formatTimeAgo } from '@/app/utils/formatTimeAgo'
import { DeleteCalendarButton } from '@/app/views/calendar/list/components/DeleteCalendarButton'

type Props = {
	calendar: CalendarBrief
}

export function CalendarListItem({ calendar }: Props) {
	const lastUpdated = formatTimeAgo(new Date(calendar.updatedAt))

	return (
		<NavigationLink to="/calendar/$calendarId" params={{ calendarId: calendar.id }}>
			<ButtonBase
				key={calendar.id}
				component="div"
				sx={{
					width: '100%',
					borderRadius: 1,
					p: 1.5,
					justifyContent: 'flex-start',
					textAlign: 'left',
					'&:hover:not(:has(.MuiIconButton-root:hover))': {
						bgcolor: 'action.hover',
					},
				}}
				aria-label={`Load calendar "${calendar.name}"`}
			>
				<Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={1}>
					<Stack flex={1} minWidth={0}>
						<Typography
							variant="body1"
							sx={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{calendar.name}
						</Typography>
						<Stack gap={0.5}>
							{calendar.description && (
								<Typography variant="body2" color="text.secondary">
									{calendar.description}
								</Typography>
							)}
							<Typography variant="body2" color="text.secondary">
								Updated {lastUpdated}
							</Typography>
						</Stack>
					</Stack>
					<Stack
						direction="row"
						gap={0.5}
						onClick={(e) => e.stopPropagation()}
						onMouseDown={(e) => e.stopPropagation()}
						sx={{ flexShrink: 0 }}
					>
						<DeleteCalendarButton calendarId={calendar.id} calendarName={calendar.name} />
					</Stack>
				</Stack>
			</ButtonBase>
		</NavigationLink>
	)
}
