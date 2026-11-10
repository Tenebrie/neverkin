import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks'
import { useRef, useState } from 'react'

import { useLazyGlobalSearchQuery } from '@/api/worldSearchApi'
import { useDebounce } from '@/app/hooks/useDebounce'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { pushApiError } from '../notifications/pushApiError'

export function GlobalSearch() {
	const anchorEl = useRef<HTMLInputElement>(null)
	const popoverState = usePopupState({
		popupId: 'global-search-popover',
		variant: 'popover',
	})
	const [performSearch] = useLazyGlobalSearchQuery()

	const [query, setQuery] = useState('')

	const fetchResults = useDebounce(async (value: string) => {
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
		}
		popoverState.open(anchorEl.current)
	}, 500)

	return (
		<>
			<TextField
				ref={anchorEl}
				size="small"
				variant="outlined"
				placeholder="Search..."
				value={query}
				onChange={(event) => {
					const value = event.currentTarget.value
					setQuery(value)
					fetchResults(value)
				}}
				sx={{
					padding: '2px 0',
					maxWidth: 192,
					'& .MuiOutlinedInput-input': { padding: '6px 6px 6px 0px' },
				}}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon
									sx={{
										color: (theme) => theme.palette.text.secondary,
									}}
								/>
							</InputAdornment>
						),
					},
				}}
			/>
			<Popover
				{...bindPopover(popoverState)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
			>
				test
			</Popover>
		</>
	)
}
