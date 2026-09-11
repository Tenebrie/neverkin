import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import { MouseEvent } from 'react'

type Props = Omit<IconButtonProps, 'onClick'> & {
	active?: boolean
	onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export function HomeRowItemIconButton({ active, onClick, ...props }: Props) {
	return (
		<IconButton
			size="small"
			{...props}
			onClick={(event) => {
				event.preventDefault()
				event.stopPropagation()
				onClick(event)
			}}
			sx={{
				color: active ? 'primary.main' : 'text.disabled',
				'&:hover': { color: active ? 'primary.main' : 'text.primary' },
				...props.sx,
			}}
		/>
	)
}
