import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { useIsReadOnly } from '@/app/views/world/hooks/useIsReadOnly'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import { ListSection } from '@/ui-lib/components/ListSection/ListSection'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'
import { WikiLandingRow } from '../WikiLandingRow'
import { useLooseThreads } from './useLooseThreads'

const MAX_LOOSE_THREADS = 8

type Props = {
	entities: BoxedWikiEntity[]
}

export function WikiLandingLintList({ entities }: Props) {
	const { isReadOnly } = useIsReadOnly()
	const { palette } = useTheme()
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const { threads } = useLooseThreads(entities)

	if (isReadOnly || threads.length === 0) {
		return null
	}

	return (
		<ListSection label="Loose threads" count={threads.length}>
			{threads.slice(0, MAX_LOOSE_THREADS).map((thread) => (
				<WikiLandingRow
					key={thread.key}
					icon={
						<EntityInitialsTile
							name={thread.label}
							color={palette.warning.main}
							size={28}
							icon={<Box sx={{ display: 'flex', '& svg': { fontSize: 16 } }}>{thread.icon}</Box>}
						/>
					}
					label={thread.label}
					meta={thread.message}
					onClick={() =>
						navigate({
							to: '/world/$worldId/wiki/$articleId',
							params: { articleId: thread.entity.id },
							search: true,
						})
					}
				>
					<Typography variant="caption" fontWeight={600} color="primary.main" noWrap>
						{thread.action}
					</Typography>
					{/* <HomeRowItemIconButton
						className="dismiss-button"
						aria-label="Dismiss"
						onClick={() => dismiss(thread.key)}
						sx={{
							p: '2px',
							opacity: 0,
							transition: 'opacity 0.16s',
							'&:focus-visible': { opacity: 1 },
						}}
					>
						<CloseIcon sx={{ fontSize: 16 }} />
					</HomeRowItemIconButton> */}
				</WikiLandingRow>
			))}
		</ListSection>
	)
}
