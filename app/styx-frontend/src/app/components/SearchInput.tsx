import Clear from '@mui/icons-material/Clear'
import Search from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'

import { TextField, TextFieldProps } from '@/ui-lib/components/TextField/TextField'

import { useStateWithDebounceCallback } from '../hooks/useStateWithDebounceCallback'

type Props = Omit<TextFieldProps, 'value' | 'onChange' | 'slotProps'> & {
	initialQuery?: string
	onChange?: (query: string) => void
	debounceTimeout?: number
}

export const SearchInput = ({ initialQuery, onChange, debounceTimeout, ...props }: Props) => {
	const [query, setQuery, setQueryInstant] = useStateWithDebounceCallback({
		initialValue: initialQuery ?? '',
		onDebounce: onChange ?? (() => {}),
		debounceTimeout,
	})

	return (
		<Stack direction="row">
			<TextField
				id="searchInput"
				placeholder="Search"
				variant="outlined"
				size="small"
				{...props}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				slotProps={{
					input: {
						endAdornment: (
							<InputAdornment position="end" disablePointerEvents={query.length === 0}>
								<IconButton
									sx={{ marginRight: -1.5 }}
									onClick={() => setQueryInstant('')}
									disabled={query.length === 0}
								>
									{query.length > 0 ? <Clear /> : <Search />}
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
		</Stack>
	)
}
