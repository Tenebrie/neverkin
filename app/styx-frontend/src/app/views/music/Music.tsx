import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useRef, useState } from 'react'
import styled from 'styled-components'

const dataSource: { title: string; playlistPath: string }[] = [
	{
		title: 'Ambient: Cavern',
		playlistPath: '7cgECSzxFYwjHugNdbur1O',
	},
	{
		title: 'Ambient: Forest',
		playlistPath: '5ayvxbK8CveLIj4llcibs2',
	},
	{
		title: 'Ambient: Mystical',
		playlistPath: '47JbzbE2fpng1VU0VeufGU',
	},
	{
		title: 'Ambient: Ocean',
		playlistPath: '0czhzWKJ1qoC9iHH5yN93a',
	},
	{
		title: 'Ambient: Storm',
		playlistPath: '3lQ1VrIoMDHJmw52N3uAEc',
	},
	{
		title: 'Atmosphere: The Cathedral',
		playlistPath: '0IyMP3izyM2jbYgJLydB00',
	},
	{
		title: 'Atmosphere: The Fey',
		playlistPath: '4jPscCOA5zrheXibHnmlU1',
	},
	{
		title: 'Atmosphere: The Manor',
		playlistPath: '6QzZjlzHxNUo9N6E19RKpJ',
	},
	{
		title: 'Atmosphere: The Road',
		playlistPath: '0gZQWj0PjC6t2bgmroHaaW',
	},
	{
		title: 'Amosphere: The Saloon',
		playlistPath: '73YmiE2tLNG5VbNF7oGmSn',
	},
	{
		title: 'Atmosphere: The Tavern',
		playlistPath: '2StSwZk9mV2DNO3aucMZYx',
	},
	{
		title: 'Atmosphere: The Town',
		playlistPath: '5GgU8cLccECwAvjDCGhYjj',
	},
	{
		title: 'Atmosphere: The Wild',
		playlistPath: '5r2AkNQOITXRqVWqYj40QG',
	},
	{
		title: 'Combat: Boss',
		playlistPath: '0Q6hJZYIEu3LwbyBBHjjHo',
	},
	{
		title: 'Combat: Duel',
		playlistPath: '5g9ZZ9Ogml8NsjOlv8N31t',
	},
	{
		title: 'Combat: Epic',
		playlistPath: '4Anyq806DQpd7pRZbSADUr',
	},
	{
		title: 'Combat: Horrifying',
		playlistPath: '1SbeUQZbRHyUEIr6wsoD4q',
	},
	{
		title: 'Combat: Standard',
		playlistPath: '0bWUBjlr7O4troJKyyMVbD',
	},
	{
		title: 'Combat: Tough',
		playlistPath: '6T0UOAmlbWb29y2fIETtL2',
	},
	{
		title: 'Monsters: Aberrations',
		playlistPath: '1IIfebxUOYAeOD2Aqvw7Rj',
	},
	{
		title: 'Monsters: Beasts',
		playlistPath: '6XslTVSeiQr80Gu79vnfXZ',
	},
	{
		title: 'Monsters: Dragons',
		playlistPath: '1qvLig9ELPmb8bcVPutk9M',
	},
	{
		title: 'Monsters: Giants',
		playlistPath: '6U68RdBoCkZFNWBXhQ4KXH',
	},
	{
		title: 'Monsters: Goblins',
		playlistPath: '58lGIqHs8HSmcYoKW7gBE3',
	},
	{
		title: 'Monsters: Hags',
		playlistPath: '4k1no9mrUph4rkFI1bEFJT',
	},
	{
		title: 'Monsters: Orcs',
		playlistPath: '46NfO4PokCdGvm6Fkbtx9u',
	},
	{
		title: 'Monsters: Tribesmen',
		playlistPath: '2crzs0lic8x58JyPZM8k3v',
	},
	{
		title: 'Monsters: Undead',
		playlistPath: '49PvqjRs9c4lgyvdOI4Lvd',
	},
	{
		title: 'Mood: Creepy',
		playlistPath: '6nSstCQcmzcEUSx8gBrcek',
	},
	{
		title: 'Mood: Denouement',
		playlistPath: '71AETM4dyul7BDNYE9zVBv',
	},
	{
		title: 'Mood: Joyful',
		playlistPath: '6KbY8nK4vdGO0zaSuoXEFr',
	},
	{
		title: 'Mood: Mysterious',
		playlistPath: '28ICiQDK37yaahRZD7aX3J',
	},
	{
		title: 'Mood: Ominous',
		playlistPath: '71yNeiFbb8bDhgLIzu9eae',
	},
	{
		title: 'Mood: Pleasant',
		playlistPath: '3O4DGo9DS5kzUUJo6EQYdp',
	},
	{
		title: 'Mood: Ridiculous',
		playlistPath: '3VepfFpcPxHIL7WyKYFdGI',
	},
	{
		title: 'Mood: Serious',
		playlistPath: '3LNrO4Jvwtzk2QD1gR8ccZ',
	},
	{
		title: 'Mood: Somber',
		playlistPath: '5N5w6WFXigWqZMLzVo6rdh',
	},
	{
		title: 'Mood: Tense',
		playlistPath: '4DYALPIektzP4vVdZFlHNe',
	},
	{
		title: 'Mood: Triumphant',
		playlistPath: '1ALzSDT8MfYQ7Xams9Nx16',
	},
	{
		title: "Mood: Vibin'",
		playlistPath: '3tpSLXgiBEtCcWQ2UBfhYm',
	},
	{
		title: 'Mood: Final Boss',
		playlistPath: '1lZR2lPoOTb9Y12hERRJtG',
	},
]

export const Music = () => {
	const [currentTab, setCurrentTab] = useState<number>(0)
	const currentPlaylist = dataSource[currentTab]

	const iframeRef = useRef<HTMLIFrameElement | null>(null)

	return (
		<>
			<Stack justifyContent="space-between">
				<Stack direction="row" gap={10} height="100dvh">
					<Stack justifyContent="space-between">
						<StyledTabs
							orientation="vertical"
							variant="scrollable"
							value={currentTab}
							onChange={(_, index) => setCurrentTab(index)}
						>
							{dataSource.map((playlist) => (
								<Tab
									key={playlist.title}
									label={playlist.title}
									sx={{ alignItems: 'start', minWidth: 500 }}
								/>
							))}
						</StyledTabs>
						<Typography variant="caption">
							Playlists by{' '}
							<a href="https://www.reddit.com/r/DnD/comments/788wbn/update_my_curated_spotify_playlists_i_use_for_dd/">
								u/bezoing
							</a>
						</Typography>
					</Stack>
					<Stack minWidth="1000px" height="98%" marginTop="1%">
						{
							<iframe
								ref={iframeRef}
								title={currentPlaylist.title}
								style={{ borderRadius: '12px' }}
								src={`https://open.spotify.com/embed/playlist/${currentPlaylist.playlistPath}?utm_source=generator`}
								width="100%"
								height="99%"
								allowFullScreen={false}
								allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
								loading="lazy"
							></iframe>
						}
					</Stack>
				</Stack>
			</Stack>
		</>
	)
}

const StyledTabs = styled(Tabs)`
	height: 100%;
	padding-top: 8px;
	padding-right: 8px;
	border-right: 1px solid gray;
	& span.MuiTabs-indicator {
		border-radius: 3px;
	}
`
