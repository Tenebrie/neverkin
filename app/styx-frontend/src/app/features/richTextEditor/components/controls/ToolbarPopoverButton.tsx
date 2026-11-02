import { PopoverButton, PopoverButtonProps } from '@/ui-lib/components/PopoverButton/PopoverButton'

type Props = Omit<PopoverButtonProps, 'color' | 'size' | 'buttonVariant'>

export function ToolbarPopoverButton({ buttonSx, ...props }: Props) {
	return (
		<PopoverButton
			{...props}
			color="secondary"
			buttonVariant="text"
			buttonSx={{
				minHeight: 44,
				minWidth: 40,
				padding: 0,
				...buttonSx,
			}}
		/>
	)
}
