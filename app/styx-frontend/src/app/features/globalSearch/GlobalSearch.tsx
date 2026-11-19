import Box from '@mui/material/Box'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import { bindPopper, usePopupState } from 'material-ui-popup-state/hooks'
import { memo, useRef, useState } from 'react'

import { GlobalSearchHit, ingestSearchHits } from '@/api/types/searchTypes'
import { GlobalSearchApiResponse, useLazyGlobalSearchQuery } from '@/api/worldSearchApi'
import { SearchInput } from '@/app/components/SearchInput'
import { useDebounce } from '@/app/hooks/useDebounce'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { pushApiError } from '../notifications/pushApiError'
import { useCustomTheme } from '../theming/hooks/useCustomTheme'
import { GlobalSearchResults } from './GlobalSearchResults'

export const GlobalSearch = memo(GlobalSearchComponent)

function GlobalSearchComponent() {
	const theme = useCustomTheme()
	const anchorEl = useRef<HTMLInputElement>(null)
	const popoverState = usePopupState({
		popupId: 'global-search-popover',
		variant: 'popper',
	})
	const [performSearch] = useLazyGlobalSearchQuery()

	const [results, setResults] = useState<GlobalSearchHit[]>([])
	const [rankedWorlds, setRankedWorlds] = useState<GlobalSearchApiResponse['worlds']>([])
	const [resultsQuery, setResultsQuery] = useState('')

	const fetchResults = useDebounce(async (value: string) => {
		if (!value) {
			setResults([])
			return
		}
		const results = parseApiResponse(
			await performSearch({
				q: value,
			}),
		)
		if (results.error) {
			pushApiError(results.error)
			return
		}
		if (results.response) {
			setResults(ingestSearchHits(results.response.hits))
			setRankedWorlds(results.response.worlds)
			setResultsQuery(value)
		}
		popoverState.open(anchorEl.current)
	}, 500)

	return (
		<ClickAwayListener onClickAway={() => popoverState.close()}>
			<Box>
				<SearchInput
					ref={anchorEl}
					onFocus={() => {
						if (results.length > 0) {
							popoverState.open(anchorEl.current)
						}
					}}
					size="small"
					variant="outlined"
					placeholder="Search..."
					onChange={(value) => {
						fetchResults(value)
					}}
					sx={{
						maxWidth: 384,
					}}
					debounceTimeout={50}
				/>
				<Popper
					{...bindPopper(popoverState)}
					sx={{
						width: 500,
						zIndex: 1000,
					}}
				>
					<Paper
						elevation={0}
						sx={{
							borderRadius: '16px',
							border: `1px solid ${theme.custom.palette.outlineStrong}`,
							boxShadow: '0 40px 100px -30px rgb(0 0 0 / 90%)',
							overflow: 'hidden',
						}}
					>
						<GlobalSearchResults
							hits={results}
							rankedWorlds={rankedWorlds}
							query={resultsQuery}
							onClose={popoverState.close}
						/>
					</Paper>
				</Popper>
			</Box>
		</ClickAwayListener>
	)
}
