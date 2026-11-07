import HelpIcon from '@mui/icons-material/HelpOutline'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'

import { Tooltip } from '@/ui-lib/components/Tooltip'

import { getDocsUrl } from '../utils/getDocsUrl'

type Props = {
	iconOnly?: boolean
}

export function DocsNavigatorButton({ iconOnly }: Props) {
	const targetUrl = getDocsUrl()

	return (
		<Link href={targetUrl} target="_blank" rel="noopener noreferrer">
			<Tooltip title={iconOnly ? 'Help & Documentation' : ''}>
				<Button
					aria-label="Help"
					variant="text"
					sx={{
						gap: 0.5,
						border: 'none',
						padding: '6px 15px',
						minWidth: iconOnly ? 'auto' : undefined,
						textDecoration: 'none',
					}}
				>
					<HelpIcon /> {!iconOnly && 'Help'} <OpenInNew sx={{ fontSize: 14, opacity: 0.6 }} />
				</Button>
			</Tooltip>
		</Link>
	)
}
