import DescriptionIcon from '@mui/icons-material/Description'
import LinkIcon from '@mui/icons-material/Link'
import PaletteIcon from '@mui/icons-material/Palette'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import useEvent from 'react-use-event-hook'

import { RichTextEditorWordCountSlotContext } from '@/app/features/richTextEditor/portals/RichTextEditorWordCountSlotContext'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

type Props = {
	contentTab: React.ReactNode
	illustrationTab?: React.ReactNode
	backlinksTab?: React.ReactNode
	isWikiTab?: boolean
	fluidHeight?: boolean
}

export function EntityEditorTabs({
	contentTab,
	illustrationTab,
	backlinksTab,
	isWikiTab,
	fluidHeight,
}: Props) {
	const { tab: defaultModalTab, wikiTab: defaultWikiTab } = useSearch({ from: '/world/$worldId/_world' })
	const defaultTab = isWikiTab ? defaultWikiTab : defaultModalTab
	const [tab, setTab] = useState(defaultTab)
	const [mountedTabs, setMountedTabs] = useState<Set<number>>(new Set([defaultTab]))
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const [wordCountSlot, setWordCountSlot] = useState<HTMLElement | null>(null)

	const handleChange = useEvent((tab: number) => {
		setTab(tab)
		navigate({
			search: (prev) => {
				const tabKey = isWikiTab ? 'wikiTab' : 'tab'
				return { ...prev, [tabKey]: tab }
			},
		})
	})

	// Track which tabs have been visited to mount them
	useEffect(() => {
		setMountedTabs((prev) => new Set(prev).add(tab))
	}, [tab])

	useEffect(() => {
		setTab(defaultTab)
	}, [defaultTab])

	return (
		<Stack direction="row" width="100%" height="100%" gap={1} sx={{ flex: 1 }}>
			<Box
				sx={{
					height: '100%',
					width: '100%',
					display: tab === 0 ? 'block' : 'none',
				}}
			>
				<RichTextEditorWordCountSlotContext value={wordCountSlot}>
					{mountedTabs.has(0) && contentTab}
				</RichTextEditorWordCountSlotContext>
			</Box>
			<Box
				sx={{
					height: '100%',
					width: 'calc(100%)',
					display: tab === 1 ? 'block' : 'none',
				}}
			>
				{mountedTabs.has(1) && illustrationTab}
			</Box>
			<Box
				sx={{
					height: '100%',
					width: 'calc(100%)',
					display: tab === 2 ? 'block' : 'none',
				}}
			>
				{mountedTabs.has(2) && backlinksTab}
			</Box>
			{tab !== 0 && <Divider orientation="vertical" />}
			<Stack justifyContent="space-between">
				<Tabs
					orientation="vertical"
					value={tab}
					onChange={(_, newValue) => handleChange(newValue)}
					sx={{
						marginTop: 0,
						...(fluidHeight && { position: 'sticky', top: 8 }),
					}}
				>
					<Tooltip title="Content tab" disableInteractive placement="right" enterDelay={700}>
						<Tab
							value={0}
							data-testid="EntityEditorContentTab"
							icon={<DescriptionIcon />}
							sx={{
								width: '100%',
								borderRadius: 0.75,
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						/>
					</Tooltip>
					<Tooltip title="Illustration tab" disableInteractive placement="right" enterDelay={700}>
						<Tab
							value={1}
							data-testid="EntityEditorIllustrationTab"
							icon={<PaletteIcon />}
							sx={{
								width: '100%',
								borderRadius: 0.75,
								display: illustrationTab ? 'block' : 'none',
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						/>
					</Tooltip>
					<Tooltip title="Backlinks tab" disableInteractive placement="right" enterDelay={700}>
						<Tab
							value={2}
							data-testid="EntityEditorBacklinksTab"
							icon={<LinkIcon sx={{ marginTop: 0.5 }} />}
							sx={{
								width: '100%',
								borderRadius: 0.75,
								display: backlinksTab ? 'block' : 'none',
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						/>
					</Tooltip>
				</Tabs>
				<Box
					ref={setWordCountSlot}
					sx={{
						display: tab === 0 ? 'block' : 'none',
						paddingBlock: 1,
						textAlign: 'center',
						contain: 'inline-size',
						...(fluidHeight && { position: 'sticky', bottom: 8 }),
					}}
				/>
			</Stack>
		</Stack>
	)
}
