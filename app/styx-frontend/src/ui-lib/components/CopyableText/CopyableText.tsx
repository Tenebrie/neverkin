import Tooltip from '@mui/material/Tooltip'
import Typography, { TypographyProps } from '@mui/material/Typography'
import { useState } from 'react'

type Props = Omit<TypographyProps, 'sx'> & {
	value: string
}

export function CopyableText({ value, ...props }: Props) {
	const [copied, setCopied] = useState(false)

	const onCopy = () => {
		navigator.clipboard.writeText(value)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Tooltip title={copied ? 'Copied!' : 'Click to copy'} placement="top" disableInteractive>
			<Typography
				{...props}
				onClick={onCopy}
				sx={{ cursor: 'pointer', wordBreak: 'break-all', '&:hover': { color: 'primary.main' } }}
			>
				{value}
			</Typography>
		</Tooltip>
	)
}
