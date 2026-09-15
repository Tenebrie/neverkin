import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useQuickCreateActor } from '@/api/hooks/useQuickCreateActor'
import { useQuickCreateArticle } from '@/api/hooks/useQuickCreateArticle'
import { useQuickCreateEvent } from '@/api/hooks/useQuickCreateEvent'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useIsReadOnly } from '@/app/views/world/hooks/useIsReadOnly'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { WikiLandingFirstRunDoor } from './WikiLandingFirstRunDoor'

export function WikiLandingFirstRun() {
	const { isReadOnly } = useIsReadOnly()
	const theme = useCustomTheme()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const createActor = useQuickCreateActor()
	const createEvent = useQuickCreateEvent()
	const createArticle = useQuickCreateArticle()

	const openCreated = (created: { id: string } | undefined) => {
		if (created) {
			navigate({ to: '/world/$worldId/wiki/$articleId', params: { articleId: created.id }, search: true })
		}
	}

	return (
		<Stack
			sx={{
				height: '100%',
				overflowY: 'auto',
				padding: 5,
				alignItems: 'center',
				justifyContent: 'center',
				background: theme.material.palette.background.default,
			}}
		>
			<Stack alignItems="center" textAlign="center" sx={{ maxWidth: 840, width: '100%' }}>
				<Typography component="h1" variant="h5" fontWeight={600} letterSpacing="-0.02em">
					Nothing here yet
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ maxWidth: '60ch', mt: 0.5, textWrap: 'pretty' }}
				>
					{isReadOnly
						? 'The owner of this world has not written anything down yet.'
						: 'A world can start anywhere — pick the door that suits how you think. You can rearrange all of it later.'}
				</Typography>
				{!isReadOnly && (
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
							gap: 2,
							mt: 4,
							textAlign: 'left',
							width: '100%',
						}}
					>
						<WikiLandingFirstRunDoor
							type="actor"
							title="Start with a person"
							body="Who is crucial for your world? Who is the protagonist? And most importantly, who dunnit?"
							buttonLabel="New character"
							onClick={async () => openCreated(await createActor({ query: '' }))}
						/>
						<WikiLandingFirstRunDoor
							type="event"
							title="Start with an event"
							body="It's high noon somewhere in the world. When is yours?"
							buttonLabel="New event"
							onClick={async () => openCreated(await createEvent({ query: '' }))}
						/>
						<WikiLandingFirstRunDoor
							type="article"
							title="Start with a blank page"
							body="Your magic system; your FTL travel rules; or mayhaps just some random notes to jot down?"
							buttonLabel="New article"
							onClick={async () => openCreated(await createArticle({ query: '' }))}
						/>
					</Box>
				)}
			</Stack>
		</Stack>
	)
}
