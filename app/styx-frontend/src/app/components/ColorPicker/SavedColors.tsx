import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { MouseEvent, ReactNode, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import {
	useCreateWorldColorMutation,
	useDeleteWorldColorMutation,
	useGetWorldColorsQuery,
} from '@/api/worldColorApi'
import { DefaultColors } from '@/app/features/colors/defaultColors'
import { colorStringToHsl } from '@/app/utils/colors/colorStringToHsl'
import { hslToHex } from '@/app/utils/colors/hslToHex'
import { keysOf } from '@/app/utils/keysOf'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

type Props = {
	currentColor: string | undefined
	onSelectColor: (color: string) => void
	size?: number
	allowSave?: boolean
	limit?: number
}

export function SavedColors({ currentColor, onSelectColor, size = 32, allowSave, limit }: Props) {
	const theme = useTheme()
	const isDarkMode = theme.palette.mode === 'dark'
	const worldId = useSelector(getWorldIdState)
	const { data: userSavedColors = [] } = useGetWorldColorsQuery({ worldId })
	const [createColor] = useCreateWorldColorMutation()
	const [deleteColor] = useDeleteWorldColorMutation()

	const savedColors = useMemo(() => {
		const colors = [
			userSavedColors.map((color) => ({
				id: color.id,
				value: color.value,
				label: color.label,
				isBuiltin: false,
				icon: null as ReactNode,
			})),
		].concat([
			keysOf(DefaultColors).map((type) => {
				const color = DefaultColors[type]
				return {
					id: `builtin:${type}`,
					value: color,
					label: `Default ${type} color` as string | null | undefined,
					isBuiltin: true,
					icon: <EntityIcon variant={type} height={size * 0.9} />,
				}
			}),
		])
		if (allowSave) {
			colors.reverse()
		}
		return colors.flat()
	}, [allowSave, size, userSavedColors])

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number
		mouseY: number
		colorId: string
	} | null>(null)

	const [labelPopover, setLabelPopover] = useState<{ anchorEl: HTMLElement } | null>(null)
	const [labelInput, setLabelInput] = useState('')

	const handleContextMenu = (event: MouseEvent, colorId: string, isBuiltin: boolean) => {
		event.preventDefault()
		if (isBuiltin) {
			return
		}
		setContextMenu({
			mouseX: event.clientX + 2,
			mouseY: event.clientY - 6,
			colorId,
		})
	}

	const handleCloseContextMenu = () => {
		setContextMenu(null)
	}

	const handleDeleteColor = () => {
		if (contextMenu) {
			deleteColor({ worldId, colorId: contextMenu.colorId })
		}
		handleCloseContextMenu()
	}

	const handleAddColor = (event: MouseEvent<HTMLButtonElement>) => {
		setLabelPopover({ anchorEl: event.currentTarget })
	}

	const handleCloseLabelPopover = () => {
		setLabelPopover(null)
		setLabelInput('')
	}

	const handleSaveColor = () => {
		if (!currentColor) {
			return
		}
		createColor({ worldId, body: { value: currentColor, label: labelInput || undefined } })
		handleCloseLabelPopover()
	}

	return (
		<>
			<Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
				{savedColors.slice(0, limit ?? Infinity).map((savedColor) => {
					const isSelected = savedColor.value === currentColor
					const tooltipTitle = savedColor.label ? (
						<>
							{savedColor.label}
							<br />
							{savedColor.value}
						</>
					) : (
						savedColor.value
					)
					return (
						<Tooltip key={savedColor.id} title={tooltipTitle} disableInteractive enterDelay={700}>
							<Box
								data-testid={`SavedColor/${savedColor.id}`}
								onClick={() => onSelectColor(savedColor.value)}
								onContextMenu={(e) => handleContextMenu(e, savedColor.id, savedColor.isBuiltin)}
								sx={{
									width: size,
									height: size,
									backgroundColor: savedColor.value,
									borderRadius: '600px',
									cursor: 'pointer',
									border: '2px solid',
									borderColor: getContrastingBorderColor(savedColor.value, isSelected, false, isDarkMode),
									transition: 'border-color 0.2s ease',
									'&:hover': {
										borderColor: getContrastingBorderColor(savedColor.value, isSelected, true, isDarkMode),
									},
								}}
							>
								{savedColor.isBuiltin && (
									<Stack alignItems="center" justifyContent="center" sx={{ paddingTop: 0.2 }}>
										{savedColor.icon}
									</Stack>
								)}
							</Box>
						</Tooltip>
					)
				})}
				{allowSave && (
					<Tooltip title="Save current color" disableInteractive enterDelay={500}>
						<Button
							size="small"
							onClick={handleAddColor}
							sx={{ width: 30, height: 30, minWidth: 'unset' }}
							color="secondary"
						>
							<AddIcon />
						</Button>
					</Tooltip>
				)}
			</Stack>
			<Menu
				open={contextMenu !== null}
				onClose={handleCloseContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
				}
			>
				<MenuItem onClick={handleDeleteColor}>Delete</MenuItem>
			</Menu>
			<Popover
				open={Boolean(labelPopover)}
				anchorEl={labelPopover?.anchorEl}
				onClose={handleCloseLabelPopover}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<Stack p={2} gap={1.5}>
					<TextField
						autoFocus
						size="small"
						label="Color label (optional)"
						value={labelInput}
						onChange={(e) => setLabelInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSaveColor()
							} else if (e.key === 'Escape') {
								handleCloseLabelPopover()
							}
						}}
					/>
					<Stack direction="row" gap={1} justifyContent="flex-end">
						<Button size="small" onClick={handleCloseLabelPopover}>
							Cancel
						</Button>
						<Button size="small" variant="contained" onClick={handleSaveColor}>
							Save
						</Button>
					</Stack>
				</Stack>
			</Popover>
		</>
	)
}

function getContrastingBorderColor(
	color: string,
	isSelected: boolean,
	isHover: boolean,
	isDarkMode: boolean,
) {
	try {
		const hsl = colorStringToHsl(color)

		// Exception: if lightness > 80%, reverse the logic
		const shouldGoLighter = hsl.l > 0.8 ? !isDarkMode : isDarkMode

		// For selected state, create strong contrast
		if (isSelected) {
			const adjustment = isHover ? (shouldGoLighter ? 0.5 : -0.5) : shouldGoLighter ? 0.4 : -0.4
			const newL = Math.max(0, Math.min(1, hsl.l + adjustment))
			return hslToHex(hsl.h, Math.max(0.3, hsl.s), newL)
		}

		// For hover on non-selected, moderate contrast
		if (isHover) {
			const adjustment = shouldGoLighter ? 0.35 : -0.35
			const newL = Math.max(0, Math.min(1, hsl.l + adjustment))
			return hslToHex(hsl.h, Math.max(0.3, hsl.s), newL)
		}

		return 'transparent'
	} catch {
		return isSelected ? (isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)') : 'transparent'
	}
}
