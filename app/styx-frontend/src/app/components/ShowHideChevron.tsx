import ChevronLeft from '@mui/icons-material/ChevronLeft'

export const ShowHideChevron = ({ collapsed }: { collapsed: boolean }) => {
	return (
		<ChevronLeft
			sx={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(270deg)', transition: 'transform 0.2s' }}
		/>
	)
}
