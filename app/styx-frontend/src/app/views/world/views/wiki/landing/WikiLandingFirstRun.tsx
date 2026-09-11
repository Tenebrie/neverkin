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
					{isReadOnly ? 'Nothing here yet.' : "Nothing here yet. That's the good part."}
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
							body="Name someone. Everything else — their house, their war, their grudge — grows out of a character sheet."
							buttonLabel="New character"
							onClick={async () => openCreated(await createActor({ query: '' }))}
						/>
						<WikiLandingFirstRunDoor
							type="event"
							title="Start with a moment"
							body="Put one dated event on the timeline and the calendar has a spine to hang the rest on."
							buttonLabel="New event"
							onClick={async () => openCreated(await createEvent({ query: '' }))}
						/>
						<WikiLandingFirstRunDoor
							type="article"
							title="Start with a blank page"
							body="No structure needed. Write, and mention things as you go — Neverkin files them for you."
							buttonLabel="New article"
							onClick={async () => openCreated(await createArticle({ query: '' }))}
						/>
					</Box>
				)}
			</Stack>
		</Stack>
	)
}
