import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { usePopupState } from 'material-ui-popup-state/hooks'
import { useState } from 'react'

import { useLazyGlobalSearchQuery } from '@/api/worldSearchApi'
import { useDebounce } from '@/app/hooks/useDebounce'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

export function GlobalSearch() {
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
		console.log(results)
	}, 500)

	return (
		<TextField
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
	)
}
