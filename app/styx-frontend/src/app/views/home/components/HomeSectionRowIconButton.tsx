import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import { SxProps, Theme } from '@mui/material/styles'
import { MouseEvent } from 'react'

import { Tooltip } from '@/ui-lib/components/Tooltip'

export const homeSectionRowIconButtonSx = (active = false): SxProps<Theme> => ({
	color: active ? 'primary.main' : 'text.disabled',
	'&:hover': { color: active ? 'primary.main' : 'text.primary' },
})

type Props = Omit<IconButtonProps, 'onClick'> & {
	tooltip: string
	active?: boolean
	onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

/** Icon action inside a row link. Swallows the click so the row never navigates. */
export function HomeSectionRowIconButton({ tooltip, active, onClick, ...props }: Props) {
	return (
		<Tooltip title={tooltip}>
			<IconButton
				size="small"
				{...props}
				onClick={(event) => {
					event.preventDefault()
					event.stopPropagation()
					onClick(event)
				}}
				sx={homeSectionRowIconButtonSx(active)}
			/>
		</Tooltip>
	)
}
