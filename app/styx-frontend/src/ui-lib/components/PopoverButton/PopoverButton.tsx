import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks'
import { ReactNode, useRef } from 'react'

import { useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import Tooltip from '@/ui-lib/components/Tooltip'

type Props = {
	content: ReactNode
	startIcon?: ReactNode
	tooltip: string
	disabled?: boolean
	color?: Parameters<typeof IconButton>['0']['color']
	size?: 'small' | 'medium' | 'large'
	popoverBody: (props: { close: () => void }) => ReactNode
	popoverAction: (props: { close: () => void }) => ReactNode
	buttonSx?: Parameters<typeof IconButton>['0']['sx']
	popoverSx?: Parameters<typeof Stack>['0']['sx']
	autofocus?: boolean
	onCleanup?: () => void
	onEnterKey?: (props: { close: () => void }) => void
	buttonVariant?: 'icon' | Parameters<typeof Button>['0']['variant']
	popoverAlign?: Parameters<typeof Popover>['0']['anchorOrigin']
	children?: ReactNode
	slotProps?: PopoverButtonSlotProps
	shortcut?: Parameters<typeof useShortcut>[0]
	disableTooltip?: boolean
}

export type PopoverButtonProps = Props

export type PopoverButtonSlotProps = {
	primaryButton?: Partial<Parameters<typeof Button>[0]>
	popover?: Partial<Parameters<typeof Popover>[0]>
}

export function PopoverButton({
	content,
	startIcon,
	tooltip,
	disabled,
	size = 'medium',
	color,
	popoverBody,
	popoverAction,
	buttonSx,
	popoverSx,
	autofocus,
	onCleanup,
	onEnterKey,
	buttonVariant = 'icon',
	popoverAlign = { vertical: 'bottom', horizontal: 'right' },
	slotProps,
	shortcut,
	disableTooltip,
}: Props) {
	const popupState = usePopupState({ variant: 'popover', popupId: tooltip })

	const popoverActionResult = popoverAction({ close: popupState.close })

	const buttonRef = useRef<HTMLButtonElement>(null)

	const sharedButtonProps = {
		ref: buttonRef,
		'aria-label': tooltip,
		...bindTrigger(popupState),
		onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
		onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault()
			e.stopPropagation()
			onCleanup?.()
			bindTrigger(popupState).onClick(e)
		},
	}

	useShortcut(
		shortcut,
		() => {
			onCleanup?.()
			popupState.open(buttonRef.current)
		},
		!popupState.isOpen,
	)

	useShortcut(
		['Enter', 'Ctrl+Enter'],
		() => {
			onEnterKey?.({ close: popupState.close })
			requestAnimationFrame(() => {
				if (document.activeElement instanceof HTMLElement) {
					document.activeElement.blur()
				}
			})
		},
		popupState.isOpen,
	)

	return (
		<>
			<Tooltip title={disableTooltip ? undefined : tooltip} disableInteractive enterDelay={700}>
				{buttonVariant === 'icon' ? (
					<IconButton
						color={color}
						size={size}
						sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, ...buttonSx }}
						disabled={disabled}
						{...sharedButtonProps}
						{...slotProps?.primaryButton}
					>
						{content}
					</IconButton>
				) : (
					<Button
						size={size}
						color={color === 'default' ? undefined : color}
						variant={buttonVariant}
						{...sharedButtonProps}
						disabled={disabled}
						startIcon={startIcon}
						sx={buttonSx}
						{...slotProps?.primaryButton}
					>
						{content}
					</Button>
				)}
			</Tooltip>
			<Popover
				{...bindPopover(popupState)}
				anchorOrigin={popoverAlign}
				transformOrigin={{ horizontal: popoverAlign.horizontal, vertical: 'top' }}
				onMouseDown={(e) => e.stopPropagation()}
				onClick={(e) => e.stopPropagation()}
				aria-label={`${tooltip} popover`}
				slotProps={{
					paper: {
						sx: {
							willChange: 'transform',
						},
						onAnimationEnd: (e) => {
							if (!autofocus || e.animationName !== 'mui-auto-fill-cancel') {
								return
							}
							const input = e.currentTarget.querySelector('input')
							input?.focus()
						},
					},
				}}
				{...slotProps?.popover}
			>
				<Stack sx={{ ...popoverSx, gap: 2 }}>
					{popoverBody({ close: popupState.close })}
					{popoverActionResult && (
						<Stack direction="row" spacing={1} justifyContent="flex-end">
							{popoverActionResult}
						</Stack>
					)}
				</Stack>
			</Popover>
		</>
	)
}
