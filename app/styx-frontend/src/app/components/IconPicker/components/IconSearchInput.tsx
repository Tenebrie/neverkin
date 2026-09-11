import Clear from '@mui/icons-material/Clear'
import Search from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useSearch } from '@tanstack/react-router'
import { memo, useCallback } from 'react'

import { useDebouncedState } from '@/app/hooks/useDebouncedState'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

export const IconSearchInput = memo(IconSearchInputComponent)

type Props = {
	onQueryChange: (query: string) => void
}

export function IconSearchInputComponent({ onQueryChange }: Props) {
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const { iq } = useSearch({ from: '/world/$worldId/_world' })

	const [, currentQuery, setQuery] = useDebouncedState({
		initialValue: iq ?? '',
		onDebounce: useCallback(
			(value: string) => {
				navigate({
					search: (prev) => ({ ...prev, iq: value || undefined }),
				})
				onQueryChange(value)
			},
			[navigate, onQueryChange],
		),
	})

	useEffectOnce(() => {
		if (iq) {
			onQueryChange(iq)
		}
	})

	const handleClear = () => {
		setQuery('')
	}

	return (
		<TextField
			fullWidth
			variant="outlined"
			placeholder="Search thousands of icons..."
			value={currentQuery}
			onChange={(e) => setQuery(e.target.value)}
			slotProps={{
				input: {
					startAdornment: (
						<InputAdornment position="start">
							<Search sx={{ color: 'text.secondary' }} />
						</InputAdornment>
					),
					endAdornment: (
						<InputAdornment
							position="end"
							sx={{
								opacity: currentQuery ? 1 : 0,
								transition: 'opacity 0.2s ease-in-out',
								pointerEvents: currentQuery ? 'auto' : 'none',
							}}
						>
							<IconButton
								onClick={handleClear}
								edge="end"
								size="small"
								sx={{
									transition: 'background-color 0.2s',
									'&:hover': {
										backgroundColor: 'action.hover',
									},
								}}
							>
								<Clear fontSize="small" />
							</IconButton>
						</InputAdornment>
					),
				},
			}}
			sx={{
				'& .MuiOutlinedInput-root': {
					backgroundColor: 'background.paper',
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: (theme) =>
							theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.14)',
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: (theme) =>
							theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.14)',
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: (theme) =>
							theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.14)',
						borderWidth: '1px',
					},
				},
			}}
		/>
	)
}
