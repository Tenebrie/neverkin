import Box from '@mui/material/Box'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import { bindPopper, usePopupState } from 'material-ui-popup-state/hooks'
import { useRef, useState } from 'react'

import { GlobalSearchHit, ingestSearchHits } from '@/api/types/searchTypes'
import { useLazyGlobalSearchQuery } from '@/api/worldSearchApi'
import { SearchInput } from '@/app/components/SearchInput'
import { useDebounce } from '@/app/hooks/useDebounce'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { pushApiError } from '../notifications/pushApiError'
import { GlobalSearchResults } from './GlobalSearchResults'

export function GlobalSearch() {
	const anchorEl = useRef<HTMLInputElement>(null)
	const popoverState = usePopupState({
		popupId: 'global-search-popover',
		variant: 'popper',
	})
	const [performSearch] = useLazyGlobalSearchQuery()

	const [results, setResults] = useState<GlobalSearchHit[]>([])

	const fetchResults = useDebounce(async (value: string) => {
		console.log('fetch')
		if (!value) {
			setResults([])
			return
		}
		const results = parseApiResponse(
			await performSearch({
				query: value,
			}),
		)
		if (results.error) {
			pushApiError(results.error)
			return
		}
		if (results.response) {
			setResults(ingestSearchHits(results.response.hits))
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
						popoverState.close()
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
						minWidth: 500,
						zIndex: 1000,
					}}
				>
					<Paper elevation={5}>
						<GlobalSearchResults hits={results} onClose={popoverState.close} />
					</Paper>
				</Popper>
			</Box>
		</ClickAwayListener>
	)
}
